import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useInputAutocomplete } from '@/hooks/useInputAutocomplete';

interface AutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  onValueChange?: (value: string) => void;
}

export default function AutocompleteInput({
  name,
  value,
  onChange,
  onValueChange,
  onBlur,
  className,
  ...props
}: AutocompleteInputProps) {
  const [inputValue, setInputValue] = useState<string>(value as string || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { 
    saveSuggestion, 
    filterSuggestions 
  } = useInputAutocomplete();

  // Update input value when the prop changes
  useEffect(() => {
    setInputValue(value as string || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Call the original onChange handler
    if (onChange) {
      onChange(e);
    }
    
    // Call the onValueChange callback
    if (onValueChange) {
      onValueChange(newValue);
    }
    
    // Update suggestions
    if (newValue.trim()) {
      const filteredSuggestions = filterSuggestions(name, newValue);
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Use setTimeout to allow click on suggestion to work
    setTimeout(() => {
      setShowSuggestions(false);
      
      // Save the input value to suggestions when field loses focus
      if (inputValue.trim()) {
        saveSuggestion(name, inputValue);
      }
      
      // Call the original onBlur handler
      if (onBlur) {
        onBlur(e);
      }
    }, 200);
  };

  const handleFocus = () => {
    if (inputValue.trim()) {
      const filteredSuggestions = filterSuggestions(name, inputValue);
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Create a synthetic event to pass to onChange
    if (onChange && inputRef.current) {
      const event = {
        target: {
          name,
          value: suggestion
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
    
    // Call the onValueChange callback
    if (onValueChange) {
      onValueChange(suggestion);
    }
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        name={name}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={className}
        {...props}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 