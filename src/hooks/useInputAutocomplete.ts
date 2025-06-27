import { useState, useEffect } from 'react';

interface AutocompleteOptions {
  // Maximum number of suggestions to store for each field
  maxSuggestions?: number;
  // Storage key prefix to use in localStorage
  storageKeyPrefix?: string;
}

export function useInputAutocomplete(options: AutocompleteOptions = {}) {
  const { 
    maxSuggestions = 10,
    storageKeyPrefix = 'input_autocomplete_'
  } = options;

  // Get suggestions for a specific field from localStorage
  const getSuggestions = (fieldName: string): string[] => {
    try {
      const key = `${storageKeyPrefix}${fieldName}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting autocomplete suggestions:', error);
      return [];
    }
  };

  // Save a new value to the suggestions list for a field
  const saveSuggestion = (fieldName: string, value: string) => {
    if (!value.trim()) return;
    
    try {
      const key = `${storageKeyPrefix}${fieldName}`;
      const currentSuggestions = getSuggestions(fieldName);
      
      // Don't add duplicates, move to the front if exists
      const newSuggestions = [
        value,
        ...currentSuggestions.filter(item => item !== value)
      ].slice(0, maxSuggestions);
      
      localStorage.setItem(key, JSON.stringify(newSuggestions));
    } catch (error) {
      console.error('Error saving autocomplete suggestion:', error);
    }
  };

  // Clear all suggestions for a specific field
  const clearSuggestions = (fieldName: string) => {
    try {
      const key = `${storageKeyPrefix}${fieldName}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing autocomplete suggestions:', error);
    }
  };

  // Filter suggestions based on input value
  const filterSuggestions = (fieldName: string, inputValue: string): string[] => {
    if (!inputValue.trim()) return [];
    
    const suggestions = getSuggestions(fieldName);
    return suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase())
    );
  };

  return {
    getSuggestions,
    saveSuggestion,
    clearSuggestions,
    filterSuggestions
  };
}