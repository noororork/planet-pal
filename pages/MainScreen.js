import React, { useState, useEffect } from "react";
import { ImageBackground, StyleSheet, View, Text, Button } from "react-native";

export default function MainScreen() {
    return (
        <ImageBackground
            source = {require("../resources/5.png")}
            style = {styles.background}
            resizeMode = "cover"
        >
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: "100%",
        height: "100%s"
    }
});