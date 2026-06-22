import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { challengeApi } from '../api';
import { getToken } from '../auth';

const ChallengeContext = createContext();

export const useChallenges = () => useContext(ChallengeContext);

export const ChallengeProvider = ({ children }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async (silent = false) => {
    if (!getToken()) {
      setChallenges([]);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    
    try {
      const result = await challengeApi.list();
      setChallenges(result.challenges || []);
    } catch (err) {
      console.error("Failed to fetch global challenges:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
    const interval = setInterval(() => {
      fetchChallenges(true); // silent background fetch
    }, 30000); 

    return () => clearInterval(interval);
  }, [fetchChallenges]);

  return (
    <ChallengeContext.Provider value={{ challenges, loading, fetchChallenges, setChallenges }}>
      {children}
    </ChallengeContext.Provider>
  );
};
