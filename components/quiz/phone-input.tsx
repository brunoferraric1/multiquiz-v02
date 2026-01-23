'use client';

import { useState, useMemo, forwardRef } from 'react';
import PhoneInputWithCountry from 'react-phone-number-input';
import { getCountries, getCountryCallingCode } from 'react-phone-number-input';
import type { Country } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';
import { ChevronDown, Search } from 'lucide-react';

// Format Brazilian phone number as (00) 00000-0000
function formatBrazilianNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// Custom input component for Brazilian formatting
const BrazilianPhoneInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { country?: Country }>(
  ({ country, value, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (country === 'BR') {
        // For Brazil, format the input
        const rawValue = e.target.value.replace(/\D/g, '');
        // Limit to 11 digits (2 DDD + 9 number)
        const limitedValue = rawValue.slice(0, 11);
        const formatted = formatBrazilianNumber(limitedValue);

        // Create a synthetic event with the raw digits for the library
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: limitedValue,
          },
        };
        onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      } else {
        onChange?.(e);
      }
    };

    // Display formatted value for Brazil
    const displayValue = country === 'BR' && typeof value === 'string'
      ? formatBrazilianNumber(value.replace(/\D/g, ''))
      : value;

    return (
      <input
        ref={ref}
        {...props}
        value={displayValue}
        onChange={handleChange}
      />
    );
  }
);
BrazilianPhoneInput.displayName = 'BrazilianPhoneInput';

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
          'flex items-center gap-2 px-3 py-3 rounded-lg border transition-colors',
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

  const handleCountryChange = (newCountry: Country) => {
    setCountry(newCountry);
  };

  // Custom input component with country context
  const InputComponent = useMemo(() => {
    return forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
      (props, ref) => <BrazilianPhoneInput ref={ref} {...props} country={country} />
    );
  }, [country]);
  InputComponent.displayName = 'InputComponent';

  return (
    <div
      className={cn(
        'phone-input-wrapper',
        '[&_.PhoneInput]:flex [&_.PhoneInput]:gap-2',
        // Flag styling
        '[&_.PhoneInputCountryIcon]:w-6 [&_.PhoneInputCountryIcon]:h-4',
        '[&_.PhoneInputCountryIcon--border]:shadow-none [&_.PhoneInputCountryIcon--border]:bg-transparent',
        // Input styling
        '[&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:px-4 [&_.PhoneInputInput]:py-3 [&_.PhoneInputInput]:rounded-lg [&_.PhoneInputInput]:border',
        '[&_.PhoneInputInput]:bg-[var(--quiz-input-bg,hsl(var(--input)))]',
        '[&_.PhoneInputInput]:border-[var(--quiz-input-border,hsl(var(--border)))]',
        '[&_.PhoneInputInput]:text-[var(--quiz-input-foreground,hsl(var(--foreground)))]',
        '[&_.PhoneInputInput]:placeholder:text-[var(--quiz-input-placeholder,hsl(var(--muted-foreground)))]',
        '[&_.PhoneInputInput]:focus:outline-none [&_.PhoneInputInput]:focus:ring-2 [&_.PhoneInputInput]:focus:ring-ring',
        // Input with error
        hasError && '[&_.PhoneInputInput]:border-destructive [&_.PhoneInputInput]:focus:ring-destructive/50',
      )}
    >
      <PhoneInputWithCountry
        id={id}
        international
        countryCallingCodeEditable={false}
        defaultCountry={defaultCountry}
        country={country}
        onCountryChange={handleCountryChange}
        value={value}
        onChange={(val) => onChange(val || '')}
        onBlur={onBlur}
        placeholder={placeholder || (country === 'BR' ? '(00) 00000-0000' : undefined)}
        limitMaxLength
        countrySelectComponent={CountrySelect}
        inputComponent={InputComponent}
      />
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
