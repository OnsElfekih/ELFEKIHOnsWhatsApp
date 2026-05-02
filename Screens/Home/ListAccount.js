import {
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
} from "react-native";

import { useEffect, useState } from "react";
import firebase from "../../Config";
import { supabase } from "../../Config";
const database=firebase.database();
const ref_all_accounts=database.ref("allaccounts");

export default function ListAccount(props) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState();
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
              <TouchableOpacity onPress={()=>{
                setIsModalVisible(true);
                setSelectedUser(item);
              }}>
              <Image
                style={{ width: 50, height: 50 }}
                source={item.UrlImage ? { uri: item.UrlImage } : require("../../assets/profil.png")}
              ></Image>
              </TouchableOpacity>
              <Text>{item.Nom}</Text>
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
      <Modal visible={isModalVisible} 
      transparent 
      animationType="fade"
      onRequestClose={() => { setIsModalVisible(false); }}>
        <View style={{
          flex: 1,
          backgroundColor: "#0004",
          alignItems: "center",
          justifyContent: "center"
        }}>
        <View style={{
          backgroundColor: "#0005"
        }}>
          <Image
              source={
    selectedUser?.UrlImage
      ? { uri: selectedUser.UrlImage }
      : require("../../assets/profil.png")
  }
            style={{ 
              width: "300", 
            height: "300",
            borderRadius:150,}}></Image>
            <Text>{selectedUser?.Nom}</Text>
            <Text>{selectedUser?.Pseudo}</Text>
            <Text>{selectedUser?.Numero}</Text>
            <Text>{selectedUser?.Email}</Text>
          
          <Pressable
          onPress={() => {
            setIsModalVisible(false);
          }}
          style={{width:"150",
            height:"45",
            backgroundColor:"blue",
            alignItems:"center",
            justifyContent:"center",
            borderRadius:8}}>
            <Text style={{color:"white"}}>Close</Text>
          </Pressable>
        </View>
        </View>
      </Modal>
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