import React from 'react';
import { Button } from 'react-bootstrap';
import { useLocale } from '../i18n/LocaleContext';

const LOCALE_OPTIONS = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
];

const LanguageSwitcher = () => {
    const { locale, setLocale, t } = useLocale();

    return (
        <div role="group" aria-label={t('languageSwitcher.label')} className="d-flex align-items-center">
            <span className="me-2 small text-muted">{t('languageSwitcher.label')}</span>
            {LOCALE_OPTIONS.map(({ code, label }) => (
                <Button
                    key={code}
                    type="button"
                    size="sm"
                    variant={locale === code ? 'primary' : 'outline-primary'}
                    className="me-1"
                    aria-pressed={locale === code}
                    onClick={() => setLocale(code)}
                >
                    {label}
                </Button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;
