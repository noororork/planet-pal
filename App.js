import React from "react";
import { ImageBackground, StyleSheet, View, Text} from "react-native";

export default function App() {
    return (
        <ImageBackground
            source = {require("./assets/5.png")}
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
});s