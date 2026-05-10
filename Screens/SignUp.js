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

const auth = firebase.auth();

export default function SignUp(props) {
  var email, password, confirmPassword;

  return (
    <ImageBackground
      source={require("../assets/backgroundimg1.jpg")}
      style={styles.container}
    >
      <View style={styles.view}>
        <Text style={styles.text}>Créer un compte</Text>

        <TextInput
          onChangeText={(txt) => {
            email = txt;
          }}
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#777"
          keyboardType="email-address"
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

        <TextInput
          onChangeText={(txt) => {
            confirmPassword = txt;
          }}
          style={styles.input}
          placeholder="Confirmer le mot de passe"
          placeholderTextColor="#777"
          secureTextEntry={true}
        />

        <View style={styles.buttonBox}>
          <Button
            onPress={() => {
              props.navigation.goBack();
            }}
            title="Annuler"
            color="#777"
          />

          <Button
            onPress={() => {
              if (password === confirmPassword) {
                auth
                  .createUserWithEmailAndPassword(email, password)
                  .then(() => {
                    alert(
                      "Compte créé avec succès. Connectez-vous maintenant.",
                    );
                    props.navigation.replace("Auth", {
                      email: email,
                    });
                  })
                  .catch((error) => {
                    alert(error.message);
                  });
              } else {
                alert("Vérifier les données...");
              }
            }}
            title="Créer"
            color="#b135a3"
          />
        </View>
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
