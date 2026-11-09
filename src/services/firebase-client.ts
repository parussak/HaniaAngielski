let firebaseSDK: Promise<typeof import('../firebase.ts')> | undefined;
export const sdk = () => firebaseSDK ??= import('../firebase.ts').catch(error => { firebaseSDK = undefined; throw error; });
export async function deadline<T>(operation: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    try {
        return await Promise.race([operation, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Połączenie trwa zbyt długo. Postępy pozostają na tym urządzeniu.')), 12000); })]);
    }
    finally {
        clearTimeout(timer!);
    }
}
