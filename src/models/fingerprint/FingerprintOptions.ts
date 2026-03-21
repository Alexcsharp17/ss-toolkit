/**
 * Options for fingerprint generation
 */
export interface FingerprintOptions {
  devices?: Array<'mobile' | 'desktop'>;
  operatingSystems?: Array<'windows' | 'macos' | 'linux' | 'ios' | 'android'>;
  browsers?: Array<'chrome' | 'firefox' | 'safari'>;
  locales?: string[];
}
