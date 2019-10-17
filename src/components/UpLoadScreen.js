import React, {Component} from 'react';
import {
    FlatList,
    StyleSheet,
    Text, View ,
    TouchableOpacity,
    Image,
    StatusBar,
} from 'react-native';

export default class UploadScreen extends Component {
    constructor(props){
        super(props)
        this.state={
            username:this.props.username,
            userpassword:'',
            listItem:[],
            currentSelectedFilename:'you have not selected any file.',
        }

        this.date=new Date().getTime();
        this.RNFS = require('react-native-fs');
        this.filename= 'ECG_record_'+this.date+'.txt';
        this.data='';
        this.path = this.RNFS.ExternalStorageDirectoryPath + '/ECG/'+this.filename;
        this.filePath=this.RNFS.ExternalStorageDirectoryPath + '/ECG/';
        this.filenameList=[];
        this.selectedFileContent='';
        this.selectedFileLength=0;
        this.selectedFileTimestamp='';
        this.url='http://129.211.88.168:8081/send/cluster-test';

        this.readFilePath(this.filePath); //异步操作 等待一会再进行check up
    }

    readFile(path)
    {
        this.RNFS.readFile(path, 'utf8')
            .then((data)=>{
                this.selectedFileContent=data;
                this.selectedFileLength=data.length;
                console.log('read file length is '+data.length);
            })
            .catch((err)=>{
                console.log(err.message,err.code);
            });
    };

    readFilePath(path)
    {
        this.RNFS.readDir(path) // On Android, use "RNFS.DocumentDirectoryPath" (MainBundlePath is not defined)
            .then((result) => {
                //console.log('GOT RESULT', result);

                for(let i=0;i<result.length;i++)
                {
                    let s=result[i].path.split('/');
                    //console.log(s[5]);
                    this.filenameList.push(s[5]);
                }
                //console.log(this.filenameList.length);
            })
            .catch((err) => {
                console.log(err.message, err.code);
            });
    };

    timeStamp2String(time)
    {
        let datetime = new Date();
        datetime.setTime(time);
        let year = datetime.getFullYear();
        let month = datetime.getMonth() + 1;
        let date = datetime.getDate();
        let hour = datetime.getHours();
        let minute = datetime.getMinutes();
        let second = datetime.getSeconds();
        let mseconds = datetime.getMilliseconds();
        return year + "-" + month + "-" + date+" "+hour+":"+minute+":"+second;//+"."+mseconds;
    };

    setListData()
    {
        console.log('seting up list data');
        this.readFilePath(this.filePath);
        let tempListItem=[];
        //console.log(this.filenameList.length);
        for(let i=0;i<this.filenameList.length;i++)
        {
            let s=this.filenameList[i].substring(11,24);
            tempListItem.push({
                key:i.toString(),
                filename:this.filenameList[i],
                date:this.timeStamp2String(s),
                timestamp:s+' ',
            })
        }

        this.setState({listItem:tempListItem});
        this.filenameList=[];
    }

    uploadData(data,url)
    {
        console.log('selected data length is '+ data.length);
        if(data.length==0)
        {
            alert('this is an empty file!');
            return;
        }

        console.log('fetching under username: '+this.state.username);

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'sendKey': 'ksl-heart-disease-group',
            },
            body: JSON.stringify({
                user: this.state.username,
                device: 'heart',
                timestamp: this.selectedFileTimestamp,
                data: data,
            }),
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
            })
            .then((responseJson) => {
                console.log("Result Code：" + responseJson.code);
                console.log("Result message：" + responseJson.message);
                alert('Upload Success');
                return responseJson.code;
            })
            .catch((error) => {
                console.log("错误信息为：" + error);
            });
    }

    render() {
        return (
            <View style={{flex: 1,backgroundColor:'indigo'}}>
                <StatusBar backgroundColor="#ff0000"
                           translucent={true}
                           hidden={true}
                           animated={true}/>
                <View style={{flex: 0.8,backgroundColor:'orange'}}>
                    <View style={{flex:1,backgroundColor:'indigo'}}>
                        <Text style={{flex:1,color:'white',textAlign:'center',marginTop:15,fontSize:20,fontWeight: 'bold'}}>CURRENT SELECTED FILE:</Text>
                    </View>
                    <View style={{flex:1.5,backgroundColor:'indigo'}}>
                        <Text style={{flex:1,color:'white',textAlign:'center',marginTop:10,fontSize:15}}>{this.state.currentSelectedFilename}</Text>
                    </View>
                </View>
                <View style={{flex: 1,backgroundColor:'indigo'}}>
                    <View style={{flex: 1,backgroundColor:'indigo',marginStart:10,marginRight:10}}>
                        <TouchableOpacity
                            style={{ flex:1, backgroundColor:'plum',marginStart:30,marginRight:30,marginTop:10,marginBottom:10,padding:3,shadowOffset:{width:10,height:10},shadowColor:'black',shadowOpacity:0.25,shadowRadius:3.84,elevation: 5,borderRadius:8.0}}
                            onPress={()=>this.setListData()}
                        >
                            <View style={{flex:1,flexDirection:'row'}}>
                                <Text style={{flex:1,fontSize:20,color:'white',marginTop:0,textAlign:'center',  textAlignVertical:'center',}}>REFRESH RECORDS LIST</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{flex: 1,backgroundColor:'indigo',marginStart:10,marginRight:10}}>
                        <TouchableOpacity
                            style={{ flex:1, backgroundColor:'plum',marginStart:30,marginRight:30,marginTop:10,marginBottom:10,padding:3,shadowOffset:{width:10,height:10},shadowColor:'black',shadowOpacity:0.25,shadowRadius:3.84,elevation: 5,borderRadius:8.0}}
                            onPress={()=>this.uploadData(this.selectedFileContent,this.url)}
                        >
                            <View style={{flex:1,flexDirection:'row'}}>
                                <Text style={{flex:1,fontSize:20,color:'white',marginTop:0,textAlign:'center',  textAlignVertical:'center',}}>UPLOAD SELECTED RECORDS</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{flex: 3,backgroundColor:'indigo'}}>
                    <FlatList
                        data={
                            this.state.listItem
                        }
                        renderItem={({item}) =>
                            <View style={{flex: 1, marginLeft:10,marginEnd:10}}>
                                <TouchableOpacity
                                    style={{ flex:1, backgroundColor:'plum',margin:5,shadowOffset:{width:10,height:10},shadowColor:'black',shadowOpacity:0.25,shadowRadius:3.84,elevation: 5,borderRadius:8.0}}
                                    onPress={()=>{
                                        this.readFile(this.filePath+item.filename);
                                        this.selectedFileTimestamp=item.date;
                                        this.setState({currentSelectedFilename:item.filename})
                                    }}
                                >
                                    <View style={{flex:1,flexDirection:'row',padding:10,backgroundColor:'blueviolet'}}>
                                        <Text style={{fontSize:15,color:'white',marginTop:0}}>{item.timestamp}</Text>
                                    </View>
                                    <View style={{flex:1,flexDirection:'row',padding:10}}>
                                        <View style={{flex:1}}>
                                            <Image style={{height:60,width:60,resizeMode: 'contain',}} source={require('../../res/Image/logo_measure.png')}/>
                                        </View>
                                        <View style={{flex:5,marginStart:10}}>
                                            <View style={{flex:1}}>
                                                <Text style={{fontSize:20,color:'white',marginTop:0}}>{item.filename}</Text>
                                            </View>
                                            <View style={{flex:1 , flexDirection:'row'}}>
                                                <Text style={{fontSize:20,color:'white',marginTop:0,}}>{item.key}</Text>
                                                <Text style={{fontSize:20,color:'white',marginTop:0,marginStart:20}}>{item.date}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    item: {
        padding: 10,
        fontSize: 18,
        height: 44,
    },
})
