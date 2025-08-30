import { configureContainer } from './ContainerConfig';

// Create global container instance
export const container = configureContainer();

// Re-export tokens for convenience
export * from './ServiceTokens';
export { DIContainer } from './DIContainer';
