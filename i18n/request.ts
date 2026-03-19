import { getRequestConfig } from 'next-intl/server';
import { isRoutingLocale, routing } from './routing';
import { getLocaleMessages } from './messages';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!isRoutingLocale(locale)) {
        locale = routing.defaultLocale;
    }

    const baseMessages = (await import(`../messages/${locale}.json`)).default;

    return {
        locale,
        messages: getLocaleMessages(locale as typeof routing.locales[number], baseMessages)
    };
});
