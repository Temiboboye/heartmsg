export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    url?: string;
}

export async function sendPushNotification(
    username: string,
    payload: PushPayload,
    env: CloudflareEnv
) {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY || env.ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
        console.error("Missing OneSignal keys. Cannot send push notification.");
        return false;
    }

    try {
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${apiKey}`,
            },
            body: JSON.stringify({
                app_id: appId,
                // Target the specific user by their username (external_id set via OneSignal.login)
                include_aliases: {
                    external_id: [username]
                },
                target_channel: "push",
                headings: { en: payload.title },
                contents: { en: payload.body },
                url: payload.url,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OneSignal API Error:', errorText);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error dispatching OneSignal push:', error);
        return false;
    }
}
