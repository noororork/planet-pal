import React, { useState, useEffect } from "react";
import { ImageBackground, StyleSheet, View, Text, TouchableOpacity } from "react-native";

export default function Home({ 
    currentUser, 
    onLogout, 
    onNextPage, 
    onNavigateToTasks, 
    onNavigateToChatbot, 
    onNavigateToShop, // New prop for shop navigation
    planetHealth 
}) {
    const [backgroundImage, setBackgroundImage] = useState(require("../resources/9.png"));

    // Logic to select background image based on planet health
    const updateHealthImage = (planetHealth) => {
        // NOTE: These paths are mocks. Ensure your actual image paths are correct in your project.
        if (planetHealth >= 80) return require("../resources/9.png");
        else if (planetHealth >= 60) return require("../resources/7.png");
        else if (planetHealth >= 40) return require("../resources/5.png");
        else if (planetHealth >= 20) return require("../resources/3.png");
        else return require("../resources/1.png");
    };

    useEffect(() => {
        setBackgroundImage(updateHealthImage(planetHealth));
    }, [planetHealth]);

    const handleNextPage = () => {
        if (onNextPage) {
            onNextPage(planetHealth); // pass the health value up to App.js
        }
    };

    return (
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleNextPage}>
            <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
                
                {/* TOP RIGHT ICON CONTAINER */}
                <View style={styles.topRightContainer}>
                    
                    {/* Shop Icon */}
                    <TouchableOpacity 
                        style={styles.topIcon} 
                        onPress={onNavigateToShop}
                    >
                        <Text style={styles.topIconText}>🛒 Shop</Text>
                    </TouchableOpacity>
                    
                    {/* Exit Icon (Logout) */}
                    <TouchableOpacity 
                        style={[styles.topIcon, { marginLeft: 10 }]} 
                        onPress={onLogout} 
                    >
                        <Text style={styles.topIconText}>🚪 Exit</Text>
                    </TouchableOpacity>
                </View>

                {/* MAIN CONTENT */}
                <View style={styles.container}>
                    {/* ENHANCED WELCOME TEXT */}
                    <Text style={styles.greetingTitle}>Greetings, Voyager!</Text>
                    {currentUser?.planetName && (
                        <Text style={styles.planetName}>Your home is: {currentUser.planetName}</Text>
                    )}
                    {/* END ENHANCED WELCOME TEXT */}
                    
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={styles.button} 
                            onPress={onNavigateToTasks}
                        >
                            <Text style={styles.buttonText}>Daily Tasks</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.button} 
                            onPress={onNavigateToChatbot}
                        >
                            <Text style={styles.buttonText}>💬 Wellness Chat</Text>
                        </TouchableOpacity>
                        
                        {/* The original Logout button is now handled by the '🚪 Exit' icon above. */}
                    </View>
                </View>
            </ImageBackground>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    background: {
        flex: 1,
        width: "100%",
        height: "100%"
    },
    
    // --- NEW STYLES FOR TOP RIGHT ICONS ---
    topRightContainer: {
        position: 'absolute',
        top: 50, // Standard adjustment for status bar/safe area on mobile
        right: 20,
        flexDirection: 'row', // To align Shop and Exit horizontally
        zIndex: 10,
    },
    topIcon: {
        backgroundColor: '#325a6dff', // Semi-transparent dark background
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#52869eff', // Violet border
    },
    topIconText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    // --- END NEW STYLES ---

    // --- ENHANCED WELCOME STYLES ---
    greetingTitle: {
        fontSize: 48, // Slightly smaller than 60, feels less overwhelming
        fontWeight: '900', // Extra bold
        color: '#fff',
        marginBottom: 4,
        marginTop: 100,
        // Added shadow for a nice glow/depth effect
        textShadowColor: 'rgba(124, 61, 237, 0.7)', // Subtle violet glow
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
        letterSpacing: 1,
    },
    planetName: {
        fontSize: 22, // Increased size for prominence
        fontWeight: 'bold',
        color: '#52869eff',
        marginBottom: 30, // Increased spacing below
    },
    // --- END ENHANCED WELCOME STYLES ---

    buttonContainer: {
        width: '100%',
        marginBottom: 100,
    },
    button: {
        width: '100%',
        backgroundColor: '#52869eff',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    }
});