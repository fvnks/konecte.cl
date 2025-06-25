'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface EditModeContextType {
  isEditMode: boolean;
  toggleEditMode: () => void;
  isAdmin: boolean;
}

const EditModeContext = createContext<EditModeContextType>({
  isEditMode: false,
  toggleEditMode: () => {},
  isAdmin: false,
});

export const useEditMode = () => useContext(EditModeContext);

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user is admin on client side
  useEffect(() => {
    const checkIfAdmin = () => {
      try {
        const userJson = localStorage.getItem('loggedInUser');
        if (userJson) {
          const user = JSON.parse(userJson);
          setIsAdmin(user.role_id === 'admin');
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkIfAdmin();
    
    // Listen for login/logout events
    const handleUserChange = () => {
      checkIfAdmin();
      // Disable edit mode if user logs out
      setIsEditMode(false);
    };
    
    window.addEventListener('userSessionChanged', handleUserChange);
    window.addEventListener('storage', handleUserChange);
    
    return () => {
      window.removeEventListener('userSessionChanged', handleUserChange);
      window.removeEventListener('storage', handleUserChange);
    };
  }, []);
  
  const toggleEditMode = () => {
    if (isAdmin) {
      setIsEditMode(prev => !prev);
    } else {
      setIsEditMode(false);
    }
  };
  
  return (
    <EditModeContext.Provider value={{ isEditMode, toggleEditMode, isAdmin }}>
      {children}
    </EditModeContext.Provider>
  );
}; 