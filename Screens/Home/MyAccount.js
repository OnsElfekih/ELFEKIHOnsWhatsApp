import { StatusBar } from "expo-status-bar";
import { set } from "firebase/database";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

import firebase from "../../Config";
const database=firebase.database();
const ref_all_accounts=database.ref("allaccounts");
const auth=firebase.auth();


export default function MyAccount(props) {
  //nekteb usess twali tjini toul useState
  const [Nom, setNom] = useState();
  const [Pseudo, setPseudo] = useState();
  const [Email, setEmail] = useState();
  const [Numero, setNumero] = useState();

  const handleDeconnect=()=>{
  auth.signOut()
  .then(()=>{props.navigation.navigate('Auth');})
  .catch((error)=>{alert(error)});
}

  return (
    <ImageBackground
      source={require("../../assets/backgroundimg1.jpg")}
      style={styles.container}
    >
      <StatusBar style="light" />
      <Text style={styles.textstyle}>Account</Text>

      <Image
        source={require("../../assets/profil.png")}
        style={{
          height: 200,
          width: 200,
          borderRadius: 100,
        }}
      />
      <TextInput
        value={Nom}
        onChangeText={(text) => setNom(text)}
        textAlign="center"
        placeholderTextColor="#fff"
        placeholder="Nom"
        keyboardType="name-phone-pad"
        style={styles.textinputstyle}
      ></TextInput>
      <TextInput
        value={Pseudo}
        onChangeText={(text) => setPseudo(text)}
        textAlign="center"
        placeholderTextColor="#fff"
        placeholder="Pseudo"
        keyboardType="name-phone-pad"
        style={styles.textinputstyle}
      ></TextInput>
      <TextInput
        value={Email}
        onChangeText={(text) => setEmail(text)}
        textAlign="center"
        placeholderTextColor="#fff"
        placeholder="Email"
        keyboardType="email-address"
        style={styles.textinputstyle}
      ></TextInput>
      <TextInput
        value={Numero}
        onChangeText={(text) => setNumero(text)}
        placeholderTextColor="#fff"
        textAlign="center"
        placeholder="Numero"
        style={styles.textinputstyle}
      ></TextInput>
      <TouchableOpacity
       onPress={()=>{
        const key=ref_all_accounts.push().key;
        const ref_one_account=ref_all_accounts.child(key);
        ref_one_account.set({
          Nom,
          Pseudo,
          Email,
          Numero
        })
       }}
        activeOpacity={0.5}
        underlayColor="#DDDDDD"
        style={styles.button}
      >
        <Text
          style={{
            color: "#FFF",
            fontSize: 24,
          }}
        >
          Save
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleDeconnect}
        activeOpacity={0.5}
        underlayColor="#DDDDDD"
        style={styles.button}
      >
        <Text
          style={{
            color: "#FFF",
            fontSize: 24,
          }}
        >
          Deconnect
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.5}
        underlayColor="#DDDDDD"
        style={[styles.button, { backgroundColor: "red" }]}
      >
        <Text
          style={{
            color: "#FFF",
            fontSize: 24,
          }}
        >
          Delete Account
        </Text>
      </TouchableOpacity>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  button: {
    marginBottom: 10,

    backgroundColor: "#08f6",
    textstyle: "italic",
    fontSize: 24,
    height: 50,
    width: "50%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 2,
  },
  textinputstyle: {
    fontWeight: "bold",
    backgroundColor: "#0002",
    fontSize: 20,
    color: "#fff",
    width: "75%",
    height: 50,
    borderRadius: 10,
    margin: 5,
    borderWidth: 2,
    borderColor: "#07f",
  },
  textstyle: {
    fontSize: 40,
    fontFamily: "serif",
    color: "#07f",
    fontWeight: "bold",
  },
  container: {
    color: "blue",
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
