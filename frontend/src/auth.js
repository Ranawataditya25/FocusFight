import jwtDecode from 'jwt-decode';

const STORAGE_KEY = 'focusfight_token';

export const setToken = (token) => {
  localStorage.setItem(STORAGE_KEY, token);
};

export const getToken = () => localStorage.getItem(STORAGE_KEY);

export const removeToken = () => localStorage.removeItem(STORAGE_KEY);

export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};
