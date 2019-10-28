// In App.js in a new project
import React ,{Component} from 'react';
import {
    TextInput,
    Alert,
    Button,
    View,
    Text,
    StyleSheet,
    Animated,
    Image,
    FlatList,
    Platform,
    TouchableOpacity,
    AppRegistry,
    StatusBar,
    BackHandler,
} from 'react-native';
import {
    createAppContainer
} from 'react-navigation';
import {
    createStackNavigator
} from 'react-navigation-stack';
import LoginScreen from './src/components/LoginScreen';
import BluetoothScreen from './src/components/BluetoothScreen'
import DataBase from './src/components/DataBase';
import UploadScreen from './src/components/UpLoadScreen';


class HomeScreen extends React.Component {
    constructor(props)
    {
        super(props);
        this.state={
            records_number:0,
            recent_record_number:0,
        }

        const {
            navigation
        } = this.props;

        this.url='http://129.211.88.168:8080/data/count/';
        this.username=navigation.getParam('username', "user");
        console.disableYellowBox = true;

        this.initialRecordNum();

    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    }

    componentWillUnmount() {
        this.backHandler.remove()
    }

    handleBackPress = () => {
        if(this.props.navigation.state.routeName==='Home')
        {
            return false;
        }
        return true;
    }


    initialRecordNum()
    {
        console.log('fetching record num');
        fetch(this.url+'user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
            })
            .then((responseJson) => {
                console.log('record nums is '+responseJson.count);
                this.setState({records_number:responseJson.count});

                return responseJson.code;
            })
            .catch((error) => {
                console.log("错误信息为：" + error);
                console.log('usr: '+this.url+this.username);
            });
    }

    render() {
        return (
            <View style={{flex: 1,backgroundColor:'indigo'}}>
                <StatusBar backgroundColor="#ff0000"
                           translucent={true}
                           hidden={true}
                           animated={true}/>
                <View style={{flex: 1, flexDirection:'row'}}>
                    <View style={{flex: 1, backgroundColor: 'indigo',marginLeft:0,marginEnd:10}}>
                        <Text style={{fontSize:30,color:'gold',marginLeft:10,marginTop:30,fontWeight: 'bold'}}>Hi,{this.username}</Text>
                        <View style={{backgroundColor: 'thistle',marginRight:200,marginTop:10,paddingRight:20,paddingTop:5,paddingBottom:10,borderBottomEndRadius:40,borderTopEndRadius:40,}}>
                            <Text style={{fontSize:20,marginLeft:10,color:'indigo'}}>{this.username}</Text>
                        </View>
                    </View>
                </View>
                <View style={{flex: 1, flexDirection:'row',marginTop:10}}>
                    <View style={{flex: 1, flexDirection:'row',backgroundColor: '#DA70D6AA',marginLeft:10,marginEnd:10,borderRadius:5.0}} >
                        <View style={{flex:3,}}>
                            <View style={{flex:1,marginTop:40,marginStart:20}}>
                                <Text style={{fontSize:18,color:'white'}}>RECORD SITUATIONS</Text>
                                <Text style={{fontSize:25,color:'white'}}>{'TOTAL '+this.state.records_number}</Text>
                                <Text style={{fontSize:10,color:'white'}}>{this.state.recent_record_number+' RECENT MEASUREMENTS'}</Text>
                            </View>
                        </View>
                        <View style={{flex:1.5}}>
                            <Image style={{marginTop:40,height:100,width:100,resizeMode: 'contain',}} source={require('./res/Image/logo_profile.png')}/>
                        </View>
                    </View>
                </View>
                <View style={{flex: 1, flexDirection:'row',marginTop:20}}>
                    <View style={{flex: 1, marginLeft:10,marginEnd:10}}>
                        <TouchableOpacity
                            style={{ flex:1, backgroundColor:'plum',margin:5,padding:10,shadowOffset:{width:10,height:10},shadowColor:'black',shadowOpacity:0.25,shadowRadius:3.84,elevation: 5,borderRadius:8.0}}
                            onPress={() => this.props.navigation.navigate('BLEModule',
                                {
                                    itemid:102,//页面之间传递的参数
                                    url:'this is other param',
                                })
                            }
                        >
                            <View style={{flex:1,}}>
                                <Image style={{height:60,width:60,resizeMode: 'contain',}} source={require('./res/Image/logo_measure.png')}/>
                                <Text style={{fontSize:20,color:'white',marginTop:30}}>ECG Measuring</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{flex: 1,marginRight:10,marginEnd:10}}>
                        <TouchableOpacity
                            style={{ flex:1, backgroundColor:'darkviolet',margin:5,padding:10,shadowOffset:{width:10,height:10},shadowColor:'black',shadowOpacity:0.25,shadowRadius:3.84,elevation: 5,borderRadius:8.0}}
                            onPress={() => this.props.navigation.navigate('Details',
                                {
                                    itemid:100,//页面之间传递的参数
                                    otherParam:'this is other param',
                                })
                            }
                        >
                            <View style={{flex:1,}}>
                                <Image style={{height:60,width:60,resizeMode: 'contain',}} source={require('./res/Image/logo_database.png')}/>
                                <Text style={{fontSize:20,color:'white',marginTop:30}}>Data Base</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{flex: 1, flexDirection:'row',marginTop:10,marginBottom: 20}}>
                    <View style={{flex: 1,marginLeft:10,marginEnd:10}}>
                        <TouchableOpacity
                            style={{ flex:1, backgroundColor:'fuchsia',margin:5,padding:10,shadowOffset:{width:10,height:10},shadowColor:'black',shadowOpacity:0.25,shadowRadius:3.84,elevation: 5,borderRadius:8.0}}
                            onPress={() => this.props.navigation.navigate('UploadModule',
                                {
                                    username:this.username,
                                })
                            }
                        >
                            <View style={{flex:1,}}>
                                <Image style={{height:60,width:60,resizeMode: 'contain',}} source={require('./res/Image/logo_uplord.png')}/>
                                <Text style={{fontSize:20,color:'white',marginTop:30}}>Uplord</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{flex: 1,marginRight:10,marginEnd:10}} >
                        <TouchableOpacity
                            style={{ flex:1, backgroundColor:'deeppink',margin:5,padding:10,shadowOffset:{width:10,height:10},shadowColor:'black',shadowOpacity:0.25,shadowRadius:3.84,elevation: 5,borderRadius:8.0}}
                            onPress={()=>console.log('you press button1')}
                        >
                            <View style={{flex:1,}}>
                                <Image style={{height:60,width:60,resizeMode: 'contain',}} source={require('./res/Image/logo_medicalorder.png')}/>
                                <Text style={{fontSize:20,color:'white',marginTop:30}}>Medical Order</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }
}

class UploadModule extends React.Component {

    //生命周期开始的时候调用一次，此后不再调用
    componentDidMount() {

    }

    constructor(props) {
        super(props);
        this.state = {
            username: "unknow username",
        }
    }

    render() {
        const {
            navigation
        } = this.props;
        const username = navigation.getParam('username', "default username");
        return (
            <View style={styles.container}>
                <UploadScreen
                    username={username}
                />
            </View>
        );
    }


}

class DataBaseModule extends React.Component {
    render() {
        const {
            navigation
        } = this.props;
        const itemID = navigation.getParam('itemid', "No-id");
        const otherParam = navigation.getParam('otherParam', "No-otherParam");
        return (
            <View style={styles.container}>
                <StatusBar backgroundColor="#ff0000"
                           translucent={true}
                           hidden={true}
                           animated={true}/>
                <DataBase/>
            </View>
        );
    }
}

class BLEModule extends React.Component {
    constructor(props){
        super(props)
    }

    render() {
        return (
            <View style={styles.container}>
                <StatusBar backgroundColor="#ff0000"
                           translucent={true}
                           hidden={true}
                           animated={true}/>
                <BluetoothScreen/>
            </View>
        );
    }

}

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state={
        }



    }

    render() {
        return (
            <View style={styles.container}>
                <StatusBar backgroundColor="#ff0000"
                           translucent={true}
                           hidden={true}
                           animated={true}/>
                <LoginScreen
                    pre='111'
                    onPress={(usr) => this.props.navigation.navigate('Home',
                    {
                        username:usr,
                    })}
                />
            </View>
        );
    }

    onPless() {

        this.props.navigation.navigate('Details');
        console.log('collect!');
    }


}

const AppNavigator = createStackNavigator({
    Home: {
        screen:HomeScreen,
        navigationOptions:{
            header:null,
        },
    },
    Details: {
        screen:DataBaseModule,
        navigationOptions:{
            headerTitle: 'DataBase',
            headerStyle: {
                backgroundColor: 'indigo',
            },
            headerTintColor:'white',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
        },
    },
    UploadModule: {
        screen:UploadModule,
        navigationOptions: {
            headerTitle: 'Upload',
            headerStyle: {
                backgroundColor: 'indigo',
            },
            headerTintColor:'white',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
        }
    },
    BLEModule: {
        screen:BLEModule,
        navigationOptions:{
            headerTitle:'BLE Module',
            headerStyle:{
            }
        }
    },
    Login:{
        screen:Login,
        navigationOptions:{
            header:null,
        }
    },
}, {
    initialRouteName: 'Login',

    defaultNavigationOptions: {
        //header: null
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    ImageContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonContainer: {
        margin: 20,
    },
    HomeButton: {
        flex: 1,
        width: 200,
        height: 200,
        marginLeft: 25,
    },
    RowButtonContainer: {
        flex: 1,
        width: 500,
        height: 200,
    },
    alternativeLayoutButtonContainer: {
        margin: 20,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    biggerfont: {
        fontSize: 20,
        color: '#FF69B4',
        fontWeight: 'bold',
        textAlign: 'center',
        margin: 20,
    },
    simpleImage: {
        flex: 1,
    },
    item: {
        flexDirection: 'column',
        borderColor: 'rgb(235,235,235)',
        borderStyle: 'solid',
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingLeft: 10,
        paddingVertical: 8,
    },
    buttonView: {
        height: 30,
        backgroundColor: 'rgb(33, 150, 243)',
        paddingHorizontal: 10,
        borderRadius: 5,
        justifyContent: "center",
        alignItems: 'center',
        marginTop: 10
    },
    buttonText: {
        color: "white",
        fontSize: 12,
    },
    content: {
        marginTop: 5,
        marginBottom: 15,
    },
    textInput: {
        paddingLeft: 5,
        paddingRight: 5,
        backgroundColor: 'white',
        height: 50,
        fontSize: 16,
        flex: 1,
    },

})

AppRegistry.registerComponent('loginAnimation', () => loginAnimation);

export default createAppContainer(AppNavigator);
