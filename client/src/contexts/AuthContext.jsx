import { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Email/Password Login
    async function login(email, password) {
        try {
            setError(null);
            const result = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (err) {
            const errorMessage = getAuthErrorMessage(err.code);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }

    // Email/Password Registration
    async function register(email, password) {
        try {
            setError(null);
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (err) {
            const errorMessage = getAuthErrorMessage(err.code);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }

    // Google Sign-In
    async function loginWithGoogle() {
        try {
            setError(null);
            const result = await signInWithPopup(auth, googleProvider);
            return { success: true, user: result.user };
        } catch (err) {
            const errorMessage = getAuthErrorMessage(err.code);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }

    // Logout
    async function logout() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    }

    // Clear error
    function clearError() {
        setError(null);
    }

    const value = {
        user,
        loading,
        error,
        login,
        register,
        loginWithGoogle,
        logout,
        clearError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Helper function for friendly error messages
function getAuthErrorMessage(code) {
    const errorMessages = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Please choose a stronger password (at least 6 characters).',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/popup-closed-by-user': 'Sign-in was cancelled.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/invalid-credential': 'Invalid credentials. Please check your email and password.'
    };

    return errorMessages[code] || 'An unexpected error occurred. Please try again.';
}

export default AuthContext;
