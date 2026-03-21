// groq-runner runs the Groq API key retrieval scenario using tls-client for HTTP
// (tempmail.lol) and rod for browser automation. Outputs JSON result to stdout.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"

	http "github.com/bogdanfinn/fhttp"
	tls_client "github.com/bogdanfinn/tls-client"
	"github.com/bogdanfinn/tls-client/profiles"
	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
)

const (
	groqLogin   = "https://console.groq.com/login"
	groqKeys    = "https://console.groq.com/keys"
	tempmailAPI = "https://api.tempmail.lol"
)

type result struct {
	Success bool   `json:"success"`
	APIKey  string `json:"apiKey"`
	Inbox   inbox  `json:"inbox"`
	Error   string `json:"error"`
	Step    string `json:"step,omitempty"` // last step (for debugging)
}

type inbox struct {
	Address  string `json:"address"`
	Provider string `json:"provider"`
}

func main() {
	proxy := flag.String("proxy", "", "Proxy URL (http://host:port or socks5://host:port)")
	mailProvider := flag.String("mail-provider", "tempmailol", "Temp mail provider (only tempmailol supported)")
	timeoutMs := flag.Int("timeout-ms", 120000, "Max scenario timeout ms")
	apiKeyName := flag.String("api-key-name", "", "API key name to create")
	stepDelayMs := flag.Int("step-delay-ms", 1000, "Delay between steps ms")
	emailPollMs := flag.Int("email-poll-ms", 5000, "Email poll interval ms")
	emailTimeoutMs := flag.Int("email-timeout-ms", 120000, "Max wait for verification email ms")
	flag.Parse()

	var step string
	out := result{Inbox: inbox{Provider: *mailProvider}}
	defer func() {
		out.Step = step
		enc := json.NewEncoder(os.Stdout)
		enc.SetEscapeHTML(false)
		_ = enc.Encode(&out)
	}()
	defer func() {
		if e := recover(); e != nil {
			out.Success = false
			out.Error = fmt.Sprintf("panic at step %q: %v", step, e)
			out.Step = step
			enc := json.NewEncoder(os.Stdout)
			enc.SetEscapeHTML(false)
			_ = enc.Encode(&out)
			os.Exit(2)
		}
	}()

	if *mailProvider != "tempmailol" {
		out.Success = false
		out.Error = "only mail-provider=tempmailol is supported"
		return
	}

	// HTTP client with TLS fingerprint (Chrome) for tempmail.lol
	opts := []tls_client.HttpClientOption{
		tls_client.WithTimeoutSeconds(90),
		tls_client.WithClientProfile(profiles.Chrome_133),
		tls_client.WithNotFollowRedirects(),
	}
	if *proxy != "" {
		opts = append(opts, tls_client.WithProxyUrl(*proxy))
	}
	client, err := tls_client.NewHttpClient(tls_client.NewNoopLogger(), opts...)
	if err != nil {
		out.Error = "tls_client: " + err.Error()
		out.Step = "init"
		os.Exit(1)
		return
	}

	step = "createInbox"
	log.Printf("[groq-runner] step: %s", step)
	addr, token, err := createInbox(client)
	if err != nil {
		out.Error = "createInbox: " + err.Error()
		os.Exit(1)
		return
	}
	out.Inbox.Address = addr
	time.Sleep(time.Duration(*stepDelayMs) * time.Millisecond)

	step = "launchBrowser"
	log.Printf("[groq-runner] step: %s", step)
	l := launcher.New()
	var proxyUser, proxyPass string
	if *proxy != "" {
		proxyServer, user, pass := parseProxyForBrowser(*proxy)
		l = l.Proxy(proxyServer)
		proxyUser, proxyPass = user, pass
	}
	l = l.Headless(true).NoSandbox(true)
	u, err := l.Launch()
	if err != nil {
		out.Error = "launcher: " + err.Error()
		os.Exit(1)
		return
	}
	browser := rod.New().ControlURL(u).MustConnect()
	defer browser.MustClose()
	// Chromium --proxy-server does not support auth in URL (ERR_NO_SUPPORTED_PROXIES). Handle 407 via CDP.
	if proxyUser != "" || proxyPass != "" {
		go browser.MustHandleAuth(proxyUser, proxyPass)()
		time.Sleep(500 * time.Millisecond) // give handler time to register before first request
	}

	page := browser.MustPage()
	page.MustSetViewport(1280, 720, 0, false)
	page = page.Timeout(time.Duration(*timeoutMs) * time.Millisecond)

	step = "navigateLogin"
	log.Printf("[groq-runner] step: %s", step)
	page.MustNavigate(groqLogin)
	time.Sleep(time.Duration(*stepDelayMs) * time.Millisecond)

	step = "fillEmail"
	log.Printf("[groq-runner] step: %s", step)
	emailInput := page.MustElement(`input[type="email"]`)
	emailInput.MustInput(addr)
	time.Sleep(time.Duration(*stepDelayMs) * time.Millisecond)

	step = "clickContinue"
	log.Printf("[groq-runner] step: %s", step)
	contBtn := page.MustElementR("button", "Continue with email")
	contBtn.MustClick()
	time.Sleep(3 * time.Second)

	step = "waitVerificationEmail"
	log.Printf("[groq-runner] step: %s", step)
	var verificationLink string
	deadline := time.Now().Add(time.Duration(*emailTimeoutMs) * time.Millisecond)
	for time.Now().Before(deadline) {
		link, err := pollVerificationLink(client, token)
		if err != nil {
			log.Printf("poll mail: %v", err)
		} else if link != "" {
			verificationLink = link
			break
		}
		time.Sleep(time.Duration(*emailPollMs) * time.Millisecond)
	}
	if verificationLink == "" {
		out.Error = "verification email not received or no link found"
		os.Exit(1)
		return
	}

	step = "openVerificationLink"
	log.Printf("[groq-runner] step: %s", step)
	page.MustNavigate(verificationLink)
	time.Sleep(3 * time.Second)

	step = "navigateKeys"
	log.Printf("[groq-runner] step: %s", step)
	page.MustNavigate(groqKeys)
	time.Sleep(2 * time.Second)

	step = "clickCreateApiKey"
	log.Printf("[groq-runner] step: %s", step)
	createBtn := page.MustElementR("button", "Create API key")
	createBtn.MustClick()
	time.Sleep(2 * time.Second)

	step = "fillApiKeyName"
	log.Printf("[groq-runner] step: %s", step)
	name := *apiKeyName
	if name == "" {
		name = fmt.Sprintf("groq-%d", time.Now().Unix())
	}
	nameInput := page.MustElement(`input[name="name"], input#name`)
	nameInput.MustInput(name)
	time.Sleep(time.Second)

	step = "selectNoExpiration"
	log.Printf("[groq-runner] step: %s", step)
	noExp := page.MustElementR("label", "No expiration")
	noExp.MustClick()
	time.Sleep(2 * time.Second)

	step = "submitCreate"
	log.Printf("[groq-runner] step: %s", step)
	for i := 0; i < 60; i++ {
		submit, err := page.ElementR("button", "Create API key")
		if err == nil && submit.MustVisible() {
			submit.MustClick()
			time.Sleep(3 * time.Second)
			break
		}
		submit2, err := page.ElementR("button", "^Create$")
		if err == nil && submit2.MustVisible() {
			submit2.MustClick()
			time.Sleep(3 * time.Second)
			break
		}
		time.Sleep(2 * time.Second)
	}

	step = "extractApiKey"
	log.Printf("[groq-runner] step: %s", step)
	keyEl := page.MustElement(`code, [data-testid="api-key"], input[readonly], pre`)
	keyText := strings.TrimSpace(keyEl.MustText())
	if len(keyText) > 20 && strings.HasPrefix(keyText, "gsk_") {
		out.Success = true
		out.APIKey = keyText
		os.Exit(0)
		return
	}
	out.Error = "could not extract API key from page"
	os.Exit(1)
}

func createInbox(client tls_client.HttpClient) (address, token string, err error) {
	req, err := http.NewRequest("GET", tempmailAPI+"/generate", nil)
	if err != nil {
		return "", "", err
	}
	req.Header = http.Header{
		"accept":     {"application/json"},
		"user-agent": {"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"},
	}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		b, _ := io.ReadAll(resp.Body)
		return "", "", fmt.Errorf("tempmail generate: %d %s", resp.StatusCode, string(b))
	}
	var v struct {
		Address string `json:"address"`
		Token   string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&v); err != nil {
		return "", "", err
	}
	if v.Address == "" {
		return "", "", fmt.Errorf("tempmail returned empty address")
	}
	return v.Address, v.Token, nil
}

// parseProxyForBrowser returns (proxy-server string for Chromium, username, password).
// Chromium does not support auth in --proxy-server (causes ERR_NO_SUPPORTED_PROXIES).
// Pass server only (host:port) and use browser.MustHandleAuth for proxy 407.
func parseProxyForBrowser(proxyURL string) (server, username, password string) {
	u, err := url.Parse(proxyURL)
	if err != nil {
		return proxyURL, "", ""
	}
	scheme := u.Scheme
	if scheme == "" {
		scheme = "http"
	}
	host := u.Host
	if host == "" {
		return proxyURL, "", ""
	}
	server = scheme + "://" + host
	if u.User != nil {
		username = u.User.Username()
		password, _ = u.User.Password()
	}
	return server, username, password
}

var linkRE = regexp.MustCompile(`https?://[^\s<>"']+(?:verify|confirm|token)[^\s<>"']*|https?://console\.groq\.com[^\s<>"']*`)

func pollVerificationLink(client tls_client.HttpClient, token string) (string, error) {
	u := tempmailAPI + "/auth/" + url.PathEscape(token)
	req, err := http.NewRequest("GET", u, nil)
	if err != nil {
		return "", err
	}
	req.Header = http.Header{
		"accept":     {"application/json"},
		"user-agent": {"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"},
	}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("auth %d", resp.StatusCode)
	}
	var v struct {
		Email []struct {
			Body string `json:"body"`
			HTML string `json:"html"`
		} `json:"email"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&v); err != nil {
		return "", err
	}
	for _, m := range v.Email {
		text := m.Body + m.HTML
		if m := linkRE.FindString(text); m != "" {
			return strings.TrimRight(m, ")>\"\t\n "), nil
		}
	}
	return "", nil
}
