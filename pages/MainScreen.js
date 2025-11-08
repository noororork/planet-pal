import React, { useState, useEffect } from "react";
import { ImageBackground, StyleSheet, View, Text, Button } from "react-native";

export default function MainScreen() {
    const [health, setHealth] = useState(100);
    const [backgroundImage, setBackgroundImage] = useState(require("../resources/9.png"));

    const updateHealthImage = (currentHealth) => {
        if (currentHealth >= 80) return require("../resources/9.png");
        else if (currentHealth >= 60) return require("../resources/7.png");
        else if (currentHealth >= 40) return require("../resources/5.png");
        else if (currentHealth >= 20) return require("../resources/3.png");
        else return require("../resources/1.png");
    };

    useEffect(() => {
        setBackgroundImage(updateHealthImage(health));
    }, [health]);

    return (
        <ImageBackground source = {backgroundImage} style = {styles.background} resizeMode = "cover"></ImageBackground>);
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: "100%",
        height: "100%s"
    }
});