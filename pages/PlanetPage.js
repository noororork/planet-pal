import React, { useState, useEffect } from "react";
import { ImageBackground, StyleSheet, View, Text, Button, TouchableOpacity } from "react-native";

export default function PlanetPage({ health, setHealth }) {
    const [backgroundImage, setBackgroundImage] = useState(require("../resources/9.png"));

    const updateHealthImage = (health) => {
        if (health >= 80) return require("../resources/10.png");
        else if (health >= 60) return require("../resources/8.png");
        else if (health >= 40) return require("../resources/6.png");
        else if (health >= 20) return require("../resources/4.png");
        else return require("../resources/2.png");
    };

    useEffect(() => {
        setBackgroundImage(updateHealthImage(health));
    }, [health]);

    return (<ImageBackground source = {backgroundImage} style = {styles.background} resizeMode = "cover"></ImageBackground>);
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
});