import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import './APICounter.css';

export default function APICounter() {
    const { user } = useAuth();
    const [apiCount, setApiCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);

        const unsubscribe = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setApiCount(data.apiRequestCount || 0);
            }
        });

        return () => unsubscribe();
    }, [user]);

    if (!user) return null;

    return (
        <div className="api-counter">
            <div className="api-counter-icon">🔢</div>
            <div className="api-counter-content">
                <div className="api-counter-label">API Requests</div>
                <div className="api-counter-value">{apiCount}</div>
            </div>
        </div>
    );
}
