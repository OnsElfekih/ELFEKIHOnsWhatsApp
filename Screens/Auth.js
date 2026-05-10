import { StatusBar } from "expo-status-bar";
import {
  Button,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import firebase from "../Config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const auth = firebase.auth();

export default function Auth(props) {
  var email = props.route.params?.email || "elfekihons@gmail.com",
    password = "elfekihons";

  return (
    <ImageBackground
      source={require("../assets/backgroundimg1.jpg")}
      style={styles.container}
    >
      <View style={styles.view}>
        <Text style={styles.text}>Connexion</Text>

        <TextInput
          defaultValue={email}
          onChangeText={(txt) => {
            email = txt;
          }}
          keyboardType="email-address"
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#777"
        />

        <TextInput
          onChangeText={(txt) => {
            password = txt;
          }}
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#777"
          secureTextEntry={true}
        />

        <Button
          onPress={() => {
            auth
              .signInWithEmailAndPassword(email, password)
              .then(async () => {
                const userid = auth.currentUser.uid;

                await AsyncStorage.setItem("userid", userid);

                props.navigation.navigate("Home", {
                  userid: userid,
                });
              })
              .catch((error) => {
                alert(error.message);
              });
          }}
          title="Se connecter"
          color="#b135a3"
        />

        <Text
          style={styles.link}
          onPress={() => {
            props.navigation.navigate("SignUp");
          }}
        >
          Créer un nouveau compte
        </Text>
      </View>

      <StatusBar style="auto" />
    </ImageBackground>
  );
}

const colors = {
  primary: "#6D2E5B",
  primaryDark: "#3B1D33",
  primaryLight: "#B135A3",
  card: "#0006",
  input: "#FFF8FC",
  textDark: "#2B1B26",
  textLight: "#FFFFFF",
  border: "#B135A3",
  muted: "#777",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  view: {
    backgroundColor: colors.card,
    width: "88%",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  text: {
    color: colors.textLight,
    fontSize: 32,
    padding: 10,
    fontStyle: "italic",
    fontWeight: "bold",
    marginBottom: 15,
  },

  input: {
    backgroundColor: colors.input,
    color: colors.textDark,
    width: "100%",
    height: 48,
    marginBottom: 12,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  link: {
    color: colors.textLight,
    marginTop: 15,
    fontSize: 15,
    textDecorationLine: "underline",
  },
});
