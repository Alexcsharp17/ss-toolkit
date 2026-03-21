/**
 * Interface for provider selection (load balancing)
 */
export interface IProviderSelector<T> {
  select(providers: T[]): T;
}
