import {
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useEffect, useState } from "react";
import firebase from "../../Config";
const database=firebase.database();
const ref_all_accounts=database.ref("allaccounts");

export default function ListAccount(props) {
  const [data, setdata] = useState([])
  const userid = props.route.params.userid;
  useEffect(() => {
      ref_all_accounts.on("value",(snapshot)=>{
      var d=[];
      snapshot.forEach(one_account => {
        d.push(one_account.val());
      });
    setdata(d);
  });
  
    return () => {
      ref_all_accounts.off();
    }
  }, [])
  

  return (
    <ImageBackground
      style={styles.container}
      source={require("../../assets/backgroundimg1.jpg")}
    >
      <Text
        style={{
          fontWeight: "bold",
          fontSize: 26,
        }}
      >
        ListAccount
      </Text>
      <FlatList
        data={data}
        renderItem={({ item }) => {
          return (
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "gray",
                marginBottom: 3,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Image
                style={{ width: 50, height: 50 }}
                source={require("../../assets/profil.png")}
              ></Image>
              <Text> {item.Nom} </Text>
              <Text> {item.Pseudo} </Text>
              <Text> {item.Email} </Text>
              <Text> {item.Numero} </Text>
              <TouchableOpacity onPress={()=>{
                props.navigation.navigate('Chat', {
                  currentid: userid,secondid:item.Id
                });
              }}>
                <Image
                  style={{ width: 30, height: 30 }}
                  source={require("../../assets/sendmsg.png")}
                ></Image>
              </TouchableOpacity>
            </View>
          );
        }}
        style={{
          backgroundColor: "#0003",
          width: "95%",
        }}
      ></FlatList>
    </ImageBackground>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    marginTop: 30,
  },
});