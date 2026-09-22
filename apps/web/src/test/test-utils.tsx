import { PropsWithChildren, ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export interface TestProviderOptions {
  initialEntries?: string[];
  queryClient?: QueryClient;
}

export function createAllTheProviders({
  initialEntries = ['/'],
  queryClient = createTestQueryClient(),
}: TestProviderOptions = {}) {
  return function AllTheProviders({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    initialEntries?: string[];
    queryClient?: QueryClient;
  }
) {
  const { initialEntries, queryClient, ...renderOptions } = options || {};
  return render(ui, {
    wrapper: createAllTheProviders({ initialEntries, queryClient }),
    ...renderOptions,
  });
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
