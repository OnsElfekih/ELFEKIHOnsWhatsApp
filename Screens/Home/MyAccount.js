import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { set } from "firebase/database";
import { useState,useEffect } from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

import firebase from "../../Config";
const database=firebase.database();
const ref_all_accounts=database.ref("allaccounts");
const auth=firebase.auth();

import {supabase} from "../../Config";

export default function MyAccount(props) {
  const userid=props.route.params.userid;
  const ref_my_account=ref_all_accounts.child(userid);

  //nekteb usess twali tjini toul useState
  const [Nom, setNom] = useState();
  const [Pseudo, setPseudo] = useState();
  const [Email, setEmail] = useState();
  const [Numero, setNumero] = useState();
  const [UrlImage, setUrlImage] = useState();

  useEffect(() => {
    ref_my_account.on("value", (snapshot) => {
      var data = snapshot.val();
      setPseudo(data.Pseudo);
      setNom(data.Nom);
      setEmail(data.Email);
      setNumero(data.Numero);
      setUrlImage(data.UrlImage);
    });
    return () => {
      ref_my_account.off();
    };
  }, []);


   const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result); //uri: lien local m telephone

    if (!result.canceled) {
      setUrlImage(result.assets[0].uri);
    }
  };


  const handleDeconnect=()=>{
    auth.signOut()
    .then(()=>{props.navigation.replace('Auth');})
    .catch((error)=>{alert(error)});
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "Êtes-vous sûr de vouloir supprimer définitivement votre compte ?",
      [
        {
          text: "Annuler",
          onPress: () => console.log("Suppression annulée"),
          style: "cancel"
        },
        {
          text: "Supprimer",
          onPress: () => {
            const currentUser = auth.currentUser;
            
            if (currentUser) {
              // Supprimer de la base de données
              ref_all_accounts.once("value", (snapshot) => {
                snapshot.forEach((child) => {
                  if (child.val().Email === currentUser.email) {
                    child.ref.remove();
                  }
                });
              });

              // Supprimer de l'authentification
              currentUser.delete()
                .then(() => {
                  alert("Compte supprimé avec succès");
                  props.navigation.replace('Auth');
                })
                .catch((error) => {
                  alert("Erreur suppression: " + error.message);
                });
            } else {
              alert("Utilisateur non trouvé");
            }
          },
          style: "destructive"
        }
      ]
    );
  }

const uploadImageToSupabase = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const arraybuffer = await new Response(blob).arrayBuffer();

    const filenameInSupabase = Date.now() + ".jpg";

    await supabase.storage
      .from("images")
      .upload(filenameInSupabase, arraybuffer, {
        upsert: true,
      });

    // getting public url
    const { data } = supabase.storage
      .from("images")
      .getPublicUrl(filenameInSupabase);
    console.log(data);
    return data.publicUrl;
  };

  return (
    <ImageBackground
      source={require("../../assets/backgroundimg1.jpg")}
      style={styles.container}
    >
      <StatusBar style="light" />
      <Text style={styles.textstyle}>Account</Text>

      <TouchableOpacity onPress={pickImage}>
      <Image
        source={UrlImage ? { uri: UrlImage } : require("../../assets/profil.png")}
        style={{
          height: 200,
          width: 200,
          borderRadius: 100,
        }}
      />
      </TouchableOpacity>
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
      //n7otou async 5atr 3ana await
       onPress={async()=>{
        const link=UrlImage ? await uploadImageToSupabase(UrlImage) : null;

        const ref_one_account=ref_all_accounts.child(userid);
        ref_one_account.set({
          Id: userid, 
          Nom,
          Pseudo,
          Email,
          Numero,
          UrlImage : link
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
        onPress={handleDeleteAccount}
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