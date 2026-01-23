'use client';

import { useState, useMemo } from 'react';
import { getCountries, getCountryCallingCode } from 'react-phone-number-input';
import type { Country } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en';
import { cn } from '@/lib/utils';
import { ChevronDown, Search } from 'lucide-react';

// Format Brazilian phone number as (00) 00000-0000
function formatBrazilianNumber(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  defaultCountry?: Country;
  hasError?: boolean;
  id?: string;
}

// Country names in different languages
const countryNames: Record<string, Record<string, string>> = {
  en,
  'pt-BR': {
    BR: 'Brasil',
    US: 'Estados Unidos',
    ES: 'Espanha',
    MX: 'México',
    PT: 'Portugal',
    AR: 'Argentina',
    CO: 'Colômbia',
    CL: 'Chile',
    PE: 'Peru',
    // Add more as needed, fallback to English for others
  },
  es: {
    BR: 'Brasil',
    US: 'Estados Unidos',
    ES: 'España',
    MX: 'México',
    PT: 'Portugal',
    AR: 'Argentina',
    CO: 'Colombia',
    CL: 'Chile',
    PE: 'Perú',
  },
};

function getCountryName(country: Country, locale: string = 'en'): string {
  return countryNames[locale]?.[country] || countryNames['en']?.[country] || country;
}

// Custom searchable country select component
function CountrySelect({
  value,
  onChange,
  options,
  iconComponent: IconComponent,
  disabled,
}: {
  value?: Country;
  onChange: (country: Country) => void;
  options: { value: Country; label: string }[];
  iconComponent: React.ComponentType<{ country: Country; label: string }>;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        opt.value.toLowerCase().includes(searchLower) ||
        `+${getCountryCallingCode(opt.value)}`.includes(search)
    );
  }, [options, search]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 h-[50px] rounded-lg border transition-colors',
          'bg-[var(--quiz-input-bg,hsl(var(--input)))]',
          'border-[var(--quiz-input-border,hsl(var(--border)))]',
          'hover:border-[var(--quiz-input-foreground,hsl(var(--foreground)))]/30',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {value && <IconComponent country={value} label={selectedOption?.label || ''} />}
        <ChevronDown className="w-4 h-4 opacity-60" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setSearch('');
            }}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 z-50 w-64 max-h-72 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
            {/* Search input */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-52 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No countries found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors',
                      'hover:bg-muted',
                      value === option.value && 'bg-primary/10 text-primary'
                    )}
                  >
                    <IconComponent country={option.value} label={option.label} />
                    <span className="flex-1 truncate">{option.label}</span>
                    <span className="text-muted-foreground">
                      +{getCountryCallingCode(option.value)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * International phone input with country selector.
 * Uses react-phone-number-input with custom styling to match our quiz theme.
 * Brazilian numbers are formatted as (00) 00000-0000.
 */
export function PhoneInput({
  value,
  onChange,
  onBlur,
  placeholder,
  defaultCountry = 'BR',
  hasError = false,
  id,
}: PhoneInputProps) {
  const [country, setCountry] = useState<Country>(defaultCountry);

  const countryCode = getCountryCallingCode(country);

  // Extract national number from E.164 value for display
  const getNationalNumber = (e164Value: string): string => {
    if (!e164Value) return '';
    // Remove + and country code
    const withoutPlus = e164Value.replace(/^\+/, '');
    const code = countryCode;
    if (withoutPlus.startsWith(code)) {
      return withoutPlus.slice(code.length);
    }
    return withoutPlus;
  };

  const nationalNumber = getNationalNumber(value);

  // Format display value for Brazil
  const displayValue = country === 'BR' && nationalNumber
    ? formatBrazilianNumber(nationalNumber)
    : nationalNumber;

  // Handle input change with Brazilian formatting
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get only digits from input
    const raw = e.target.value.replace(/\D/g, '');

    if (country === 'BR') {
      // Limit to 11 digits for Brazil (2 DDD + 9 number)
      const limited = raw.slice(0, 11);
      onChange(limited ? `+${countryCode}${limited}` : '');
    } else {
      // Limit to reasonable max (15 digits is E.164 max minus country code)
      const limited = raw.slice(0, 15);
      onChange(limited ? `+${countryCode}${limited}` : '');
    }
  };

  const handleCountryChange = (newCountry: Country) => {
    setCountry(newCountry);
    onChange('');
  };

  // Get placeholder based on country
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (country === 'BR') return '(00) 00000-0000';
    return undefined;
  };

  // Build options for country select
  const countryOptions = useMemo(() => {
    return getCountries().map((c) => ({
      value: c,
      label: en[c] || c,
    }));
  }, []);

  return (
    <div className="flex gap-2">
      {/* Country selector */}
      <CountrySelect
        value={country}
        onChange={handleCountryChange}
        options={countryOptions}
        iconComponent={({ country: c }) => (
          <img
            src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${c}.svg`}
            alt={c}
            className="w-6 h-4 object-cover rounded-sm"
          />
        )}
      />

      {/* Phone input with country code prefix */}
      <div
        className={cn(
          'flex-1 flex items-center gap-1 px-4 h-[50px] rounded-lg border transition-colors',
          'bg-[var(--quiz-input-bg,hsl(var(--input)))]',
          hasError
            ? 'border-destructive focus-within:ring-2 focus-within:ring-destructive/50'
            : 'border-[var(--quiz-input-border,hsl(var(--border)))] focus-within:ring-2 focus-within:ring-ring',
        )}
      >
        {/* Country code (non-editable) */}
        <span className="text-[var(--quiz-input-foreground,hsl(var(--foreground)))] shrink-0">
          +{countryCode}
        </span>

        {/* Input field */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={onBlur}
          placeholder={getPlaceholder()}
          className={cn(
            'flex-1 bg-transparent border-none outline-none',
            'text-[var(--quiz-input-foreground,hsl(var(--foreground)))]',
            'placeholder:text-[var(--quiz-input-placeholder,hsl(var(--muted-foreground)))]',
          )}
        />
      </div>
    </div>
  );
}

// Helper to map app locale to default country
export function getDefaultCountryFromLocale(locale: string): Country {
  switch (locale) {
    case 'en':
      return 'US';
    case 'es':
      return 'ES';
    case 'pt-BR':
    default:
      return 'BR';
  }
}
