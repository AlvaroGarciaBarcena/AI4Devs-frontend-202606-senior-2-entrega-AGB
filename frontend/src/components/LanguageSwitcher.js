import React from 'react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const LOCALE_OPTIONS = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
];

const LanguageSwitcher = () => {
    const { t, i18n } = useTranslation();

    return (
        <div role="group" aria-label={t('languageSwitcher.label')} className="d-flex align-items-center">
            <span className="me-2 small text-muted">{t('languageSwitcher.label')}</span>
            {LOCALE_OPTIONS.map(({ code, label }) => (
                <Button
                    key={code}
                    type="button"
                    size="sm"
                    variant={i18n.resolvedLanguage === code ? 'primary' : 'outline-primary'}
                    className="me-1"
                    aria-pressed={i18n.resolvedLanguage === code}
                    lang={code}
                    onClick={() => i18n.changeLanguage(code)}
                >
                    {label}
                </Button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;
