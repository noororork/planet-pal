import React, { useState, useEffect } from "react";
import { ImageBackground, StyleSheet, View, Text, Button, TouchableOpacity } from "react-native";

export default function Home({ currentUser, onLogout, onNextPage, planetHealth}) {
    const [backgroundImage, setBackgroundImage] = useState(require("../resources/9.png"));

    const updateHealthImage = (planetHealth) => {
        if (planetHealth >= 80) return require("../resources/9.png");
        else if (planetHealth >= 60) return require("../resources/7.png");
        else if (planetHealth >= 40) return require("../resources/5.png");
        else if (planetHealth >= 20) return require("../resources/3.png");
        else if (planetHealth >= 0) return require("../resources/1.png");
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
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => onNextPage(planetHealth)}>
            <ImageBackground source = {backgroundImage} style = {styles.background} resizeMode = "cover">
                <View style={styles.container}>
                    <Text style={styles.title}>Welcome!</Text>
                    {currentUser?.planetName && (
                        <Text style={styles.planetName}>Planet: {currentUser.planetName}</Text>
                    )}
                    <TouchableOpacity style={styles.button} onPress={onLogout}>
                        <Text style={styles.buttonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        </TouchableOpacity>);
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
    title: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        marginTop: 100,
      },
    planetName: {
        fontSize: 16,
        color: '#A78BFA',
        marginBottom: 20,
      },
    button: {
        width: '100%',
        backgroundColor: '#7C3AED',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 100,
      },
      buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
      }
});