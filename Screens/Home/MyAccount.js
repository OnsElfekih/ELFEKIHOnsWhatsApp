import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  View,
} from "react-native";

import firebase from "../../Config";
import { supabase } from "../../Config";

const database = firebase.database();
const ref_all_accounts = database.ref("allaccounts");
const auth = firebase.auth();

export default function MyAccount(props) {
  const userid = props.route.params.userid;
  const ref_my_account = ref_all_accounts.child(userid);

  const [Nom, setNom] = useState("");
  const [Pseudo, setPseudo] = useState("");
  const [Email, setEmail] = useState("");
  const [Numero, setNumero] = useState("");
  const [UrlImage, setUrlImage] = useState("");

  useEffect(() => {
    ref_my_account.on("value", (snapshot) => {
      var data = snapshot.val();

      if (data != null) {
        setPseudo(data.Pseudo || "");
        setNom(data.Nom || "");
        setNumero(data.Numero || "");
        setUrlImage(data.UrlImage || "");
      }

      if (auth.currentUser) {
        setEmail(auth.currentUser.email);
      }
    });

    return () => {
      ref_my_account.off();
    };
  }, []);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Permission to access the media library is required.",
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setUrlImage(result.assets[0].uri);
    }
  };

  const handleDeconnect = () => {
    auth
      .signOut()
      .then(() => {
        props.navigation.replace("Auth");
      })
      .catch((error) => {
        Alert.alert("Erreur", error.message);
      });
  };

  const handleDeleteAccount = () => {
    Alert.alert("Supprimer le compte", "Voulez-vous supprimer ce compte ?", [
      {
        text: "Annuler",
        style: "cancel",
      },
      {
        text: "Supprimer",
        onPress: () => {
          const currentUser = auth.currentUser;

          if (currentUser) {
            ref_my_account.remove();

            currentUser
              .delete()
              .then(() => {
                Alert.alert("Succès", "Compte supprimé avec succès");
                props.navigation.replace("Auth");
              })
              .catch((error) => {
                Alert.alert("Erreur suppression", error.message);
              });
          } else {
            Alert.alert("Erreur", "Utilisateur non trouvé");
          }
        },
        style: "destructive",
      },
    ]);
  };

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

    const { data } = supabase.storage
      .from("images")
      .getPublicUrl(filenameInSupabase);

    return data.publicUrl;
  };

  return (
    <ImageBackground
      source={require("../../assets/backgroundimg1.jpg")}
      style={styles.container}
    >
      <StatusBar style="light" />

      <View style={styles.card}>
        <Text style={styles.title}>Mon compte</Text>

        <TouchableOpacity onPress={pickImage}>
          <Image
            source={
              UrlImage ? { uri: UrlImage } : require("../../assets/profil.png")
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>

        <Text style={styles.changePhoto}>Changer la photo</Text>

        <TextInput
          value={Nom}
          onChangeText={(text) => setNom(text)}
          textAlign="center"
          placeholderTextColor="#ddd"
          placeholder="Nom"
          keyboardType="name-phone-pad"
          style={styles.textinputstyle}
        />

        <TextInput
          value={Pseudo}
          onChangeText={(text) => setPseudo(text)}
          textAlign="center"
          placeholderTextColor="#ddd"
          placeholder="Pseudo"
          keyboardType="name-phone-pad"
          style={styles.textinputstyle}
        />

        <TextInput
          value={Email}
          editable={false}
          textAlign="center"
          placeholderTextColor="#ddd"
          placeholder="Email"
          keyboardType="email-address"
          style={styles.emailInput}
        />

        <TextInput
          value={Numero}
          onChangeText={(text) => setNumero(text)}
          placeholderTextColor="#ddd"
          textAlign="center"
          placeholder="Numero"
          keyboardType="phone-pad"
          style={styles.textinputstyle}
        />

        <TouchableOpacity
          onPress={async () => {
            let link = UrlImage;

            if (UrlImage && UrlImage.startsWith("file")) {
              link = await uploadImageToSupabase(UrlImage);
            }

            const ref_one_account = ref_all_accounts.child(userid);

            ref_one_account.set({
              Id: userid,
              Nom,
              Pseudo,
              Email: auth.currentUser.email,
              Numero,
              UrlImage: link,
            });

            Alert.alert("Succès", "Compte modifié avec succès", [
              {
                text: "OK",
              },
            ]);
          }}
          activeOpacity={0.5}
          style={styles.saveButton}
        >
          <Text style={styles.buttonText}>Sauvegarder</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeconnect}
          activeOpacity={0.5}
          style={styles.logoutButton}
        >
          <Text style={styles.buttonText}>Se déconnecter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          activeOpacity={0.5}
          style={styles.deleteButton}
        >
          <Text style={styles.buttonText}>Supprimer le compte</Text>
        </TouchableOpacity>
      </View>
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
  danger: "#C62828",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    width: "90%",
    backgroundColor: colors.card,
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 12,
  },

  title: {
    fontSize: 34,
    fontFamily: "serif",
    color: colors.primaryLight,
    fontWeight: "bold",
    marginBottom: 12,
  },

  profileImage: {
    height: 150,
    width: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },

  changePhoto: {
    color: colors.textLight,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 12,
  },

  textinputstyle: {
    fontWeight: "bold",
    backgroundColor: colors.input,
    fontSize: 17,
    color: colors.textDark,
    width: "88%",
    height: 50,
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: colors.border,
  },

  emailInput: {
    fontWeight: "bold",
    backgroundColor: "#D8D2D6",
    fontSize: 17,
    color: colors.muted,
    width: "88%",
    height: 50,
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: "#AAA",
  },

  saveButton: {
    marginTop: 14,
    backgroundColor: colors.primaryLight,
    height: 50,
    width: "68%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },

  logoutButton: {
    marginTop: 10,
    backgroundColor: colors.primaryDark,
    height: 50,
    width: "68%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },

  deleteButton: {
    marginTop: 10,
    backgroundColor: colors.danger,
    height: 50,
    width: "68%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },

  buttonText: {
    color: colors.textLight,
    fontSize: 19,
    fontWeight: "bold",
  },
});
