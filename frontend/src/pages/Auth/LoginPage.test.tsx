import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from './LoginPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import * as authApi from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';

// Mock dependencies
vi.mock('../../api/auth');
vi.mock('../../store/useAuthStore');
vi.mock('@react-oauth/google', () => ({
    GoogleLogin: () => <button>Google Login Mock</button>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('LoginPage', () => {
    const mockSetAuth = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup Zustand mock
        (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: unknown) => unknown) => {
            if (selector) return selector({ setAuth: mockSetAuth });
            return { setAuth: mockSetAuth };
        });
    });

    it('renders login form correctly', () => {
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        expect(screen.getByText('QR-EMS 系統登入')).toBeInTheDocument();
        expect(screen.getByLabelText('使用者名稱')).toBeInTheDocument();
        expect(screen.getByLabelText('密碼')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
    });

    it('updates input values on change', () => {
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        const usernameInput = screen.getByLabelText('使用者名稱') as HTMLInputElement;
        const passwordInput = screen.getByLabelText('密碼') as HTMLInputElement;

        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(usernameInput.value).toBe('testuser');
        expect(passwordInput.value).toBe('password123');
    });

    it('calls login api and navigates on success', async () => {
        // Mock successful login response
        const mockResponse = { access: 'fake-token', refresh: 'fake-refresh', user: { id: 1, username: 'testuser' } };
        vi.mocked(authApi.login).mockResolvedValue(mockResponse as unknown as Awaited<ReturnType<typeof authApi.login>>);

        render(
            <MemoryRouter initialEntries={['/login']}>
                <LoginPage />
            </MemoryRouter>
        );

        // Fill form
        fireEvent.change(screen.getByLabelText('使用者名稱'), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'password123' } });

        // Submit
        fireEvent.click(screen.getByRole('button', { name: '登入' }));

        // Check loading state (optional, might happen too fast)
        // expect(screen.getByRole('button')).toBeDisabled(); 

        await waitFor(() => {
            expect(authApi.login).toHaveBeenCalledWith('testuser', 'password123');
        });

        expect(mockSetAuth).toHaveBeenCalledWith('fake-token', 'fake-refresh', mockResponse.user);
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('displays error message on login failure', async () => {
        // Suppress console.error for this test case as we expect an error
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Mock failed login
        vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText('使用者名稱'), { target: { value: 'wrong' } });
        fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'wrong' } });
        fireEvent.click(screen.getByRole('button', { name: '登入' }));

        await waitFor(() => {
            expect(screen.getByText('Login failed. Please check your credentials.')).toBeInTheDocument();
        });

        expect(mockNavigate).not.toHaveBeenCalled();
        
        // Restore console.error
        consoleSpy.mockRestore();
    });
});