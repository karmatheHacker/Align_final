import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    TextInput,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';

const BG_COLOR = '#f9f7f2';
const TEXT_DARK = '#1d1d1f';

export default function ProjectDocumentUploadScreen() {
    const navigation = useNavigation();
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [parsing, setParsing] = useState(false);

    // Form fields
    const [title, setTitle] = useState('');
    const [documentReference, setDocumentReference] = useState('');
    const [version, setVersion] = useState('');
    const [status, setStatus] = useState('');

    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const uploadProjectDocument = useMutation(api.ai.propoze.uploadProjectDocument);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'text/plain'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            setSelectedFile(file);

            // Auto-fill title from filename
            if (!title) {
                const fileName = file.name.replace(/\.(pdf|txt)$/i, '');
                setTitle(fileName);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const parseDocumentContent = async (fileUri: string): Promise<{ content: string; sections: any[] }> => {
        // For demo purposes, we'll use a simple text extraction
        // In production, you'd use a PDF parsing library or backend service
        try {
            const response = await fetch(fileUri);
            const text = await response.text();

            // Simple section extraction based on common patterns
            const sections = extractSections(text);

            return {
                content: text,
                sections,
            };
        } catch (error) {
            console.error('Error parsing document:', error);
            // Fallback: return raw text
            return {
                content: 'Document content placeholder',
                sections: [],
            };
        }
    };

    const extractSections = (text: string): any[] => {
        const sections: any[] = [];
        const lines = text.split('\n');

        let currentSection = { title: 'Introduction', content: '', page: 1, sectionNumber: '0' };
        let sectionNumber = 0;

        for (const line of lines) {
            // Detect section headers (e.g., "Section 1:", "1.", "Section 1.1")
            const sectionMatch = line.match(/^Section\s+(\d+(?:\.\d+)?)[:\s]+(.+)/i);
            const numberedMatch = line.match(/^(\d+(?:\.\d+)?)\.\s+(.+)/);

            if (sectionMatch || numberedMatch) {
                // Save previous section if it has content
                if (currentSection.content.trim()) {
                    sections.push({ ...currentSection });
                }

                // Start new section
                sectionNumber++;
                const secNum = sectionMatch ? sectionMatch[1] : numberedMatch![1];
                const secTitle = sectionMatch ? sectionMatch[2] : numberedMatch![2];

                currentSection = {
                    title: secTitle.trim(),
                    content: '',
                    page: Math.floor(sectionNumber / 3) + 1, // Estimate page
                    sectionNumber: secNum,
                };
            } else {
                currentSection.content += line + '\n';
            }
        }

        // Add last section
        if (currentSection.content.trim()) {
            sections.push(currentSection);
        }

        return sections;
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            Alert.alert('Error', 'Please select a document first');
            return;
        }

        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a project title');
            return;
        }

        setUploading(true);
        setParsing(false);

        try {
            // Step 1: Get upload URL
            const uploadUrl = await generateUploadUrl();

            // Step 2: Upload file to Convex storage
            const response = await fetch(selectedFile.uri);
            const blob = await response.blob();

            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                headers: { 'Content-Type': selectedFile.mimeType || 'application/pdf' },
                body: blob,
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file');
            }

            const { storageId } = await uploadResponse.json();

            // Step 3: Parse document content
            setParsing(true);
            const { content, sections } = await parseDocumentContent(selectedFile.uri);

            // Step 4: Save document metadata
            await uploadProjectDocument({
                title: title.trim(),
                documentReference: documentReference.trim() || undefined,
                version: version.trim() || undefined,
                status: status.trim() || undefined,
                storageId,
                parsedContent: content,
                sectionsJson: JSON.stringify(sections),
            });

            Alert.alert(
                'Success',
                'Project document uploaded successfully!',
                [
                    {
                        text: 'Start Analyzing',
                        onPress: () => (navigation as any).navigate('PropozeChat'),
                    },
                ]
            );
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload document. Please try again.');
        } finally {
            setUploading(false);
            setParsing(false);
        }
    };

    const isButtonDisabled = uploading || !selectedFile || !title.trim();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="chevron-left" size={24} color={TEXT_DARK} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Upload Project Document</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Propoze Branding */}
                <View style={styles.brandingContainer}>
                    <View style={styles.iconWrapper}>
                        <LinearGradient
                            colors={['#8B9DFF', '#C4B5FD']}
                            style={styles.propozeIcon}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <MaterialCommunityIcons name="file-document-outline" size={36} color="white" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.brandingTitle}>Propoze Intelligence</Text>
                    <Text style={styles.brandingSubtitle}>
                        Upload project requirements to get{'\n'}citation-based insights
                    </Text>
                </View>

                {/* File Picker */}
                <TouchableOpacity
                    style={styles.filePickerButton}
                    onPress={pickDocument}
                    disabled={uploading}
                    activeOpacity={0.7}
                >
                    <View style={styles.uploadIconContainer}>
                        <Feather
                            name="upload"
                            size={20}
                            color="#6e8efb"
                        />
                    </View>
                    <Text style={styles.filePickerText}>
                        {selectedFile ? selectedFile.name : 'Select PDF or Text Document'}
                    </Text>
                </TouchableOpacity>

                {/* Form Fields */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Project Title <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., MediCare+ Smart Patient Portal"
                            placeholderTextColor="#c7c7cc"
                            value={title}
                            onChangeText={setTitle}
                            editable={!uploading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Document Reference</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., #MC-2026-TRD"
                            placeholderTextColor="#c7c7cc"
                            value={documentReference}
                            onChangeText={setDocumentReference}
                            editable={!uploading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Version</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 1.0.2"
                            placeholderTextColor="#c7c7cc"
                            value={version}
                            onChangeText={setVersion}
                            editable={!uploading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Status</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Confidential / RFP Phase"
                            placeholderTextColor="#c7c7cc"
                            value={status}
                            onChangeText={setStatus}
                            editable={!uploading}
                        />
                    </View>
                </View>

                {/* Upload Button */}
                <LinearGradient
                    colors={isButtonDisabled ? ['#d1d1d6', '#d1d1d6'] : ['#6e8efb', '#a777e3']}
                    style={styles.uploadButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <TouchableOpacity
                        onPress={handleUpload}
                        disabled={isButtonDisabled}
                        style={styles.uploadButton}
                        activeOpacity={0.8}
                    >
                        {uploading ? (
                            <View style={styles.uploadingContainer}>
                                <ActivityIndicator color="white" size="small" />
                                <Text style={styles.uploadButtonText}>
                                    {parsing ? 'Parsing Document...' : 'Uploading...'}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.uploadButtonText}>Upload & Analyze</Text>
                        )}
                    </TouchableOpacity>
                </LinearGradient>

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Feather name="info" size={14} color="#6e8efb" />
                    <Text style={styles.infoText}>
                        Propoze will analyze your document and provide evidence-based answers with citations
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG_COLOR,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5ea',
        backgroundColor: 'white',
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: TEXT_DARK,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
    },
    brandingContainer: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    iconWrapper: {
        shadowColor: '#8B9DFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: 20,
    },
    propozeIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandingTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: TEXT_DARK,
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    brandingSubtitle: {
        fontSize: 15,
        color: '#86868b',
        textAlign: 'center',
        lineHeight: 22,
    },
    filePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e5ea',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    uploadIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f2f2f7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    filePickerText: {
        flex: 1,
        fontSize: 15,
        color: TEXT_DARK,
        fontWeight: '500',
    },
    form: {
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: TEXT_DARK,
        marginBottom: 10,
        letterSpacing: -0.2,
    },
    required: {
        color: '#ff3b30',
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e5e5ea',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: TEXT_DARK,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
        elevation: 1,
    },
    uploadButtonGradient: {
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#6e8efb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    uploadButton: {
        width: '100%',
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    uploadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f0f4ff',
        padding: 14,
        borderRadius: 12,
        gap: 10,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#5568d3',
        lineHeight: 19,
    },
});
