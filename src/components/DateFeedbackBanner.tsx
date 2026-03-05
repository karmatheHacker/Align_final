import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, TextInput, Animated, ActivityIndicator } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '../constants/colors';
import { w, h, f, SP } from '../utils/responsive';

const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

export default function DateFeedbackBanner() {
    const awaiting = useQuery(api.ai.dateFeedback.getMatchesAwaitingFeedback);
    const submitFeedback = useMutation(api.ai.dateFeedback.submitDateFeedback);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    const [thumbsUp, setThumbsUp] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (awaiting === undefined) return null;
    if (awaiting.length === 0) return null;

    const currentMatch = awaiting[0];

    const handleSubmit = async () => {
        if (thumbsUp === null) return;
        setIsSubmitting(true);
        try {
            await submitFeedback({
                toClerkId: currentMatch.otherClerkId,
                thumbsUp: thumbsUp,
            });
            setModalVisible(false);
            setThumbsUp(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.banner}
                activeOpacity={0.9}
                onPress={() => {
                    setSelectedMatch(currentMatch);
                    setModalVisible(true);
                }}
            >
                <View style={styles.bannerLeft}>
                    <View style={styles.iconRing}>
                        <MaterialCommunityIcons name="account-heart-outline" size={w(18)} color={ORANGE} />
                    </View>
                    <View>
                        <Text style={styles.bannerTitle}>HOW DID IT GO?</Text>
                        <Text style={styles.bannerSub}>Tell us about your time with {currentMatch.otherName}</Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(13,13,13,0.3)" />
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color={BLACK} />
                        </TouchableOpacity>

                        {currentMatch.otherPhoto && (
                            <Image source={{ uri: currentMatch.otherPhoto }} style={styles.avatar} />
                        )}

                        <Text style={styles.modalTitle}>How was your date with {currentMatch.otherName}?</Text>
                        <Text style={styles.modalSub}>Your feedback is private and helps Align find you better matches.</Text>

                        <View style={styles.choiceRow}>
                            <TouchableOpacity
                                style={[styles.choiceBtn, thumbsUp === true && styles.choiceBtnActive]}
                                onPress={() => setThumbsUp(true)}
                            >
                                <Ionicons name="happy-outline" size={w(32)} color={thumbsUp === true ? CREAM : BLACK} />
                                <Text style={[styles.choiceText, thumbsUp === true && styles.choiceTextActive]}>GREAT</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.choiceBtn, thumbsUp === false && styles.choiceBtnActiveNeg]}
                                onPress={() => setThumbsUp(false)}
                            >
                                <Ionicons name="sad-outline" size={w(32)} color={thumbsUp === false ? CREAM : BLACK} />
                                <Text style={[styles.choiceText, thumbsUp === false && styles.choiceTextActive]}>NOT FOR ME</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitBtn, thumbsUp === null && styles.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={thumbsUp === null || isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={CREAM} />
                            ) : (
                                <Text style={styles.submitBtnText}>SAVE FEEDBACK</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: SP.md,
    },
    banner: {
        backgroundColor: '#FFFFFF',
        borderRadius: w(22),
        padding: w(16),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(13,13,13,0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    bannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: w(12),
        flex: 1,
    },
    iconRing: {
        width: w(40),
        height: w(40),
        borderRadius: w(20),
        backgroundColor: ORANGE + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: f(11),
        color: BLACK,
        letterSpacing: 1.5,
    },
    bannerSub: {
        fontFamily: 'Inter_500Medium',
        fontSize: f(12),
        color: 'rgba(13,13,13,0.5)',
        marginTop: 2,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: CREAM,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 30,
        alignItems: 'center',
        paddingBottom: 50,
    },
    closeBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 5,
    },
    avatar: {
        width: w(80),
        height: w(80),
        borderRadius: w(40),
        marginBottom: 20,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    modalTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: f(22),
        color: BLACK,
        textAlign: 'center',
        marginBottom: 10,
        lineHeight: f(28),
    },
    modalSub: {
        fontSize: f(14),
        color: 'rgba(13,13,13,0.4)',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: f(20),
        marginBottom: 30,
    },
    choiceRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 40,
    },
    choiceBtn: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 24,
        paddingVertical: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(13,13,13,0.06)',
    },
    choiceBtnActive: {
        backgroundColor: '#00C853',
        borderColor: '#00C853',
    },
    choiceBtnActiveNeg: {
        backgroundColor: '#FF3B30',
        borderColor: '#FF3B30',
    },
    choiceText: {
        fontFamily: 'Inter_900Black',
        fontSize: f(10),
        color: 'rgba(13,13,13,0.4)',
        marginTop: 12,
        letterSpacing: 1,
    },
    choiceTextActive: {
        color: CREAM,
    },
    submitBtn: {
        width: '100%',
        backgroundColor: BLACK,
        paddingVertical: 18,
        borderRadius: 100,
        alignItems: 'center',
    },
    submitBtnDisabled: {
        backgroundColor: 'rgba(13,13,13,0.1)',
    },
    submitBtnText: {
        fontFamily: 'Inter_900Black',
        fontSize: f(12),
        color: CREAM,
        letterSpacing: 2,
    },
});
