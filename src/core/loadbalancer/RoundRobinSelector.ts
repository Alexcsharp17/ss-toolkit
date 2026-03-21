import { IProviderSelector } from './IProviderSelector';

/**
 * Round-robin provider selector
 */
export class RoundRobinSelector<T> implements IProviderSelector<T> {
  private index = 0;

  select(providers: T[]): T {
    if (providers.length === 0) {
      throw new Error('No providers available');
    }
    const provider = providers[this.index % providers.length];
    this.index++;
    return provider;
  }
}
