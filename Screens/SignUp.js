import { StatusBar } from 'expo-status-bar';
import { Button, ImageBackground, StyleSheet, Text, TextInput, View } from 'react-native';
import firebase from '../Config';

const auth=firebase.auth();

export default function SignUp(props) {
  var email,password,confirmPassword;

  return (
    <ImageBackground source={require("../assets/backgroundimg1.jpg")} style={styles.container}>
      <View style={styles.view}>
      <Text style={styles.text}>Register!</Text>
      <TextInput onChangeText={(txt)=>{email=txt}} style={styles.input} placeholder="email@address.com"></TextInput>
      <TextInput onChangeText={(txt)=>{password=txt}} style={styles.input} placeholder="**password**"></TextInput>
      <TextInput onChangeText={(txt)=>{confirmPassword=txt}} style={styles.input} placeholder="**confirm password**"></TextInput>
       </View>

        <View style={{flexDirection: 'row',gap: 10,marginTop: 15}}> 
            <Button onPress={()=>{
              if(password===confirmPassword){
              auth.createUserWithEmailAndPassword(email,password)
              .then(()=>{props.navigation.navigate('Home');})
              .catch((error)=>{alert(error)});
              }
            else alert ("vérifier les données...");}}
             title="Sign Up" color="#b135a3"></Button>
            <Button onPress={()=>{props.navigation.goBack()}} title="Back" color="#b135a3"></Button>
        </View>
      <StatusBar style="auto" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#785274',
    alignItems: 'center', //align horizontal
    justifyContent: 'center', //align vertical
  },
  text: {
    backgroundColor: '#785274',
    color: 'white',
    fontSize: 30,
    padding: 10,
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: 'white',
    width: "95%",
    height: 45,
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 7,
    textAlign: 'center',
  },
  view: {
    backgroundColor: '#0004',
    width: "90%",
    height: 300,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  } 
});
