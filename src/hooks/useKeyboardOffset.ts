import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';

export default function useKeyboardOffset() {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        if (Platform.OS !== 'ios') return;

        const onKeyboardWillShow = (e: KeyboardEvent) => {
            setOffset(e.endCoordinates.height);
        };

        const onKeyboardWillHide = () => {
            setOffset(0);
        };

        const showSubscription = Keyboard.addListener('keyboardWillShow', onKeyboardWillShow);
        const hideSubscription = Keyboard.addListener('keyboardWillHide', onKeyboardWillHide);

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    return offset;
}
