import React, { useState, useEffect } from "react";
import { ImageBackground, StyleSheet, View, Text, TouchableOpacity } from "react-native";

// NOTE: Assuming onNavigateToChatbot and onNavigateToShop are passed as props
export default function PlanetPage({ 
    health, 
    setHealth, 
    currentUser, // Required for displaying planet name (if available)
    onLogout, 
    onNavigateToTasks, 
    onNavigateToChatbot, 
    onNavigateToShop 
}) {
    // Current health determines the background image
    const [backgroundImage, setBackgroundImage] = useState(require("../resources/9.png"));
    const [showGreeting, setShowGreeting] = useState(true); // State to control visibility

    const updateHealthImage = (health) => {
        // NOTE: Ensure these paths exist in your project's resources folder
        if (health >= 80) return require("../resources/10.png");
        else if (health >= 60) return require("../resources/8.png");
        else if (health >= 40) return require("../resources/6.png");
        else if (health >= 20) return require("../resources/4.png");
        else return require("../resources/2.png");
    };

    useEffect(() => {
        // Mock health update for demonstration if setHealth is not used
        setBackgroundImage(updateHealthImage(health || 80)); 
        
        // Timer to hide the greeting after 2000ms (2 seconds)
        if (showGreeting) {
            const timer = setTimeout(() => {
                setShowGreeting(false);
            }, 1500); 
            
            // Cleanup function to clear the timer if the component unmounts
            return () => clearTimeout(timer);
        }
    }, [health, showGreeting]);

    return (
        <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
            
            {/* TOP RIGHT ICON CONTAINER */}
            <View style={styles.topRightContainer}>
                
                {/* Shop Icon */}
                {onNavigateToShop && (
                    <TouchableOpacity 
                        style={styles.topIcon} 
                        onPress={onNavigateToShop}
                    >
                        <Text style={styles.topIconText}>🛒 Shop</Text>
                    </TouchableOpacity>
                )}
                
                {/* Wellness Chat Button */}
                {onNavigateToChatbot && (
                    <TouchableOpacity 
                        style={[styles.topIcon, { marginLeft: 10 }]} 
                        onPress={onNavigateToChatbot} 
                    >
                        <Text style={styles.topIconText}>💬 Chat</Text>
                    </TouchableOpacity>
                )}

                 {/* Exit Icon (Logout) */}
                {onLogout && (
                    <TouchableOpacity 
                        style={[styles.topIcon, { marginLeft: 10 }]} 
                        onPress={onLogout} 
                    >
                        <Text style={styles.topIconText}>🚪 Exit</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* MAIN CONTENT (Container for button) */}
            <View style={styles.container}>
                
                {/* Greeting Overlay (Absolute position, visible for 2 seconds) */}
                {showGreeting && (
                    <View style={styles.greetingOverlay}>
                        <Text style={styles.greetingTitle}>Your Wellness Planet</Text>
                        {currentUser?.planetName && (
                            <Text style={styles.planetName}>{currentUser.planetName}</Text>
                        )}
                    </View>
                )}

                {/* Daily Missions Button (Aligned to flex-end) */}
                {onNavigateToTasks && (
                    <TouchableOpacity 
                        style={styles.button} 
                        onPress={onNavigateToTasks}
                    >
                        <Text style={styles.buttonText}>Daily Missions</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    // --- COLOR PALETTE (Using consistent theme colors) ---
    // Deep Teal Blue: #1C3B5E
    // Soft Blue/Grey: #396C8E
    // Teal Blue Accent: #60B3B0
    // Mint Green: #8EE4AF
    // Pale Cyan: #E0F7FA

    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end', // Align content near the bottom
        padding: 30,
        backgroundColor: 'rgba(28, 59, 94, 0.4)', // Light overlay on planet page
    },
    background: {
        flex: 1,
        width: "100%",
        height: "100%"
    },
    
    // --- TOP RIGHT ICON STYLES ---
    topRightContainer: {
        position: 'absolute',
        top: 50,
        right: 20,
        flexDirection: 'row',
        zIndex: 10,
    },
    topIcon: {
        backgroundColor: 'rgba(57, 108, 142, 0.7)', // Soft Blue/Grey transparent background
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#60B3B0', // Teal Blue Accent border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    topIconText: {
        color: '#E0F7FA', // Pale Cyan text
        fontSize: 14,
        fontWeight: '600',
    },
    // --- END TOP RIGHT ICON STYLES ---

    // --- TEMPORARY GREETING OVERLAY ---
    greetingOverlay: {
        position: 'absolute',
        bottom: 150, // Positioned above the button
        alignItems: 'center',
        width: '100%',
    },
    // --- MAIN TEXT STYLES ---
    greetingTitle: {
        fontSize: 48,
        fontWeight: '900',
        color: '#E0F7FA',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
        letterSpacing: 1,
    },
    planetName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#8EE4AF', // Mint Green
        marginBottom: 30,
    },
    // --- BUTTON STYLES (Example) ---
    button: {
        width: '100%',
        backgroundColor: '#60B3B0', // Teal Blue Accent
        padding: 18,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 50, // Space from the bottom of the container
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    buttonText: {
        color: '#E0F7FA',
        fontSize: 18,
        fontWeight: '700',
    }
});