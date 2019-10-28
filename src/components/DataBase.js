import React, {Component} from 'react';
import {
    View,
    Button,
    Text,
    TouchableOpacity,
    Image,
} from 'react-native';
import { StackedAreaChart,BarChart, PieChart ,Grid, LineChart, YAxis, XAxis} from 'react-native-svg-charts'
import * as shape from 'd3-shape'
import RNPickerSelect from 'react-native-picker-select';
import {readFile} from 'react-native-fs';

export default class DataBase extends Component {

    constructor(props){
        super(props)
        this.state={
            filename_list:[],
            line_chart_data : [10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10],
            is_playing:false,
        }

        this.RNFS = require('react-native-fs');
        this.data='';
        this.filenameList=[];
        this.selectedFileContent='';
        this.selectedFileLength=0;
        this.selectedFileTimestamp='';
        this.selectedFileName='';
        this.path = this.RNFS.ExternalStorageDirectoryPath + '/ECG/'+this.selectedFileName;
        this.filePath=this.RNFS.ExternalStorageDirectoryPath + '/ECG/';
        this.play_rate=1000;


        this.readFilePath(this.filePath); //异步操作 等待一会再进行check up

        this.data1 = [
            {
                month: new Date(2015, 0, 1),
                apples: 3840,
                bananas: 1920,
                cherries: 960,
                dates: 400,
            },
            {
                month: new Date(2015, 1, 1),
                apples: 1600,
                bananas: 1440,
                cherries: 960,
                dates: 400,
            },
            {
                month: new Date(2015, 2, 1),
                apples: 640,
                bananas: 960,
                cherries: 3640,
                dates: 400,
            },
            {
                month: new Date(2015, 3, 1),
                apples: 3320,
                bananas: 480,
                cherries: 640,
                dates: 400,
            },
        ];
        this.colors = ['#8800cc', '#aa00ff', '#cc66ff', '#eeccff'];
        this.keys = ['apples', 'bananas', 'cherries', 'dates'];
        this.svgs = [
            { onPress: () => console.log('apples') },
            { onPress: () => console.log('bananas') },
            { onPress: () => console.log('cherries') },
            { onPress: () => console.log('dates') },
        ];

        this.pie_chart_data = [20,80];
        const pieChartColor=['lightcyan','aquamarine'];
        this.pieData = this.pie_chart_data
            .filter((value) => value > 0)
            .map((value, index) => ({
                value,
                svg: {
                    fill: pieChartColor[index],
                    onPress: () => console.log('press', index),
                },
                key: `pie-${index}`,
            }));

        this.contentInset = { top: 20, bottom: 20 };
        this.XAxisData = [50, 10, 40, 95, -4, -24, 85, 91, 35, 53, -53, 24, 50, -20, -80]

    }

    readFilePath(path)
    {
        this.RNFS.readDir(path)
            .then((result) => {
                //console.log('GOT RESULT', result);

                for(let i=0;i<result.length;i++)
                {
                    let s=result[i].path.split('/');
                    //console.log(s[5]);
                    this.filenameList.push(s[5]);
                }
                console.log(this.filenameList.length);
            })
            .catch((err) => {
                console.log(err.message, err.code);
            });
    };

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

    initFilenameList()
    {
        console.log('seting up list data with '+this.filenameList.length+" files.");
        //this.readFilePath(this.filePath);
        let tempListItem=[];
        //console.log(this.filenameList.length);
        for(let i=0;i<this.filenameList.length;i++)
        {
            let s=this.filenameList[i].substring(11,24);
            tempListItem.push({
                label:this.timeStamp2String(s),
                value:this.filenameList[i],
            })
        }

        this.setState({filename_list:tempListItem})
    };

    initPlayData(rate)
    {
        this.readFile(this.path);
        this.play_rate=rate;
        console.log('the length of play data is '+this.selectedFileContent.length+' rate is '+this.play_rate);
    }

    startPlayData()
    {

        console.log('play data length is '+this.selectedFileContent.length);
        this.setState({is_playing:true});
        let temp=this.selectedFileContent.split(" ");
        this.selectedFileTimestamp=temp[0];


        let i=1;
        let interval=setInterval(() => {

            if(this.state.is_playing==false||i>=this.selectedFileContent.length){
                clearInterval(interval);
                return;
            }

            let temp_line_chart_data=[];
            for(let k=0;k<100;k++)
            {
                if(i<this.selectedFileContent.length)
                {
                    temp_line_chart_data.push(parseInt(temp[i] , 10 ));
                    i++;
                }
            }
            this.setState({line_chart_data:temp_line_chart_data});

        }, this.play_rate)

    }

    stopPlayData()
    {
        this.setState({is_playing:false});
    }



    render() {
        return (
            <View style={{flex: 1,backgroundColor:'indigo'}}>
                <View style={{flex: 0.4,flexDirection:'row', backgroundColor:'indigo',marginTop:10}}>
                    <View style={{ flex:1, backgroundColor:'rebeccapurple',marginLeft:20,marginEnd:20,marginTop:10,marginBottom:5,padding:0,shadowOffset:{width:10,height:10},shadowColor:'black',shadowOpacity:0.25,shadowRadius:3.84,elevation: 5,borderRadius:30}}>
                        <RNPickerSelect
                            onValueChange={(value) => {
                                this.selectedFileName=value;
                                this.path=this.RNFS.ExternalStorageDirectoryPath + '/ECG/'+this.selectedFileName;
                                console.log('you have select '+this.path);
                            }}
                            items={this.state.filename_list}
                            style={{flex:1, color:'white'}}
                            placeholder={{label:'Select record',value:'unchosen'}}
                            placeholderTextColor={'white'}
                        />
                    </View>
                    <TouchableOpacity
                        style={{ flex:0.8, backgroundColor:'rebeccapurple',marginLeft:10,marginEnd:20,marginTop:10,marginBottom:5,padding:0,shadowOffset:{width:10,height:10},shadowColor:'black',shadowOpacity:0.25,shadowRadius:3.84,elevation: 5,borderRadius:30}}
                        onPress={()=>{
                            this.initFilenameList();
                        }}
                    >
                        <View  style={{ flex:1,}}>
                            <Text style={{flex:1,color:'white',textAlign:'center',marginTop:13,fontSize:18,fontWeight:'bold'}}>LOAD DATA</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={{flex: 0.4, flexDirection:'row',marginTop:5,backgroundColor:'indigo'}}>
                    <View style={{ flex:1, backgroundColor:'rebeccapurple',marginLeft:20,marginEnd:20,marginTop:10,marginBottom:5,padding:0,shadowOffset:{width:10,height:10},shadowColor:'black',shadowOpacity:0.25,shadowRadius:3.84,elevation: 5,borderRadius:30}}>
                        <RNPickerSelect
                            onValueChange={(value) => this.initPlayData(value)}
                            items={[
                                {
                                    label:'quick',
                                    value: 100,
                                },
                                {
                                    label:'middle',
                                    value: 200,
                                },
                                {
                                    label:'slow',
                                    value: 500,
                                },

                            ]}
                            style={{flex:1, color:'white'}}
                            placeholder={{label:'Select play mode',value:'unchosen'}}
                            placeholderTextColor={'white'}
                        />
                    </View>
                    <TouchableOpacity
                        style={{ flex:0.8, backgroundColor:'rebeccapurple',marginLeft:10,marginEnd:20,marginTop:10,marginBottom:5,padding:0,shadowOffset:{width:10,height:10},shadowColor:'black',shadowOpacity:0.25,shadowRadius:3.84,elevation: 5,borderRadius:30}}
                        onPress={()=>{
                            this.state.is_playing?this.stopPlayData():this.startPlayData();

                        }}
                    >
                        <View  style={{ flex:1,}}>
                            <Text style={{flex:1,color:'white',textAlign:'center',marginTop:13,fontSize:18,fontWeight:'bold'}}>{this.state.is_playing?'STOP':'PLAY'}</Text>
                        </View>
                    </TouchableOpacity>

                </View>
                <View style={{flex: 1,marginTop:10}}>
                    <View style={{flex: 1, backgroundColor: 'rebeccapurple',marginLeft:10,marginEnd:10,}} >
                        <View style={{ flex: 1, flexDirection: 'row',backgroundColor:'turquoise' }}>
                            <Image style={{height:20,width:20,resizeMode: 'contain',marginLeft:10,marginTop:5}} source={require('../../res/Image/logo_chart1.png')}/>
                            <Text style={{fontSize:15,fontWeight:'bold',color:'white',marginLeft:15,marginTop:6}}>PIECHART</Text>
                        </View>
                        <View style={{ flex: 3.5, flexDirection: 'row',paddingLeft:10,paddingRight:10,paddingTop:10,paddingBottom:5,}}>
                            <View style={{flex: 1, backgroundColor: '',marginLeft:20}}>
                                <View style={{flex:3,padding:10,flexDirection:'row',backgroundColor:''}}>
                                    <Text style={{fontSize:40,color:'white',marginLeft:5,}}>80</Text>
                                    <Text style={{fontSize:30,color:'white',marginTop:13}}>%</Text>
                                </View>
                                <View style={{flex:2,padding:5,flexDirection:'row',backgroundColor:''}}>
                                    <Text style={{fontSize:15,color:'white',marginLeft:15,}}>Normal</Text>
                                </View>
                            </View>
                            <PieChart style={{ flex:1.5 ,padding:5}} data={this.pieData} />
                            <View style={{flex: 1, backgroundColor: '',marginEnd:20}}>
                                <View style={{flex:3,padding:10,flexDirection:'row',backgroundColor:''}}>
                                    <Text style={{fontSize:40,color:'white',marginLeft:5,}}>20</Text>
                                    <Text style={{fontSize:30,color:'white',marginTop:13}}>%</Text>
                                </View>
                                <View style={{flex:2,padding:5,flexDirection:'row',backgroundColor:''}}>
                                    <Text style={{fontSize:15,color:'white',marginLeft:10,}}>Abnormal</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={{flex: 1,marginTop:10}}>
                    <View style={{flex: 1, backgroundColor: 'rebeccapurple',padding:0,marginLeft:10,marginEnd:10,}} >
                        <View style={{ flex: 1, flexDirection: 'row',backgroundColor:'orangered' }}>
                            <Image style={{height:20,width:20,resizeMode: 'contain',marginLeft:10,marginTop:5}} source={require('../../res/Image/logo_chart2.png')}/>
                            <Text style={{fontSize:15,fontWeight:'bold',color:'white',marginLeft:15,marginTop:6}}>HEARTRATE</Text>
                        </View>
                        <View style={{ flex: 3.5, flexDirection: 'row',paddingLeft:10,paddingRight:10,paddingTop:10,paddingBottom:10,}}>
                            <StackedAreaChart
                                style={{ flex:1}}
                                data={this.data1}
                                keys={this.keys}
                                colors={this.colors}
                                curve={shape.curveNatural}
                                showGrid={false}
                                svgs={this.svgs}
                            />
                        </View>
                    </View>
                </View>
                <View style={{flex: 1, flexDirection:'row',marginTop:10}}>
                    <View style={{flex: 1, backgroundColor: 'rebeccapurple',padding:0,marginLeft:10,marginEnd:10,marginBottom:10}} >
                        <View style={{ flex: 1, flexDirection: 'row',backgroundColor:'darkorange' }}>
                            <Image style={{height:20,width:20,resizeMode: 'contain',marginLeft:10,marginTop:5}} source={require('../../res/Image/logo_chart3.png')}/>
                            <Text style={{fontSize:15,fontWeight:'bold',color:'white',marginLeft:15,marginTop:6}}>ECG WAVE FORM</Text>
                        </View>
                        <View style={{ flex: 3.5, flexDirection: 'row',paddingLeft:15,paddingRight:10,}}>
                            {/*<YAxis*/}
                            {/*data={this.data4}*/}
                            {/*contentInset={this.contentInset}*/}
                            {/*svg={{*/}
                                {/*fill: 'white',*/}
                                {/*fontSize: 10,*/}
                            {/*}}*/}
                            {/*numberOfTicks={10}*/}
                            {/*formatLabel={(value) => `${value} ti/m`}*/}
                            {/*/>*/}
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <LineChart
                                    style={{ flex: 5 }}
                                    data={this.state.line_chart_data}
                                    svg={{ stroke: 'darkorange' }}
                                    contentInset={this.contentInset}
                                >
                                    <Grid />
                                </LineChart>
                                {/*<XAxis*/}
                                    {/*style={{ flex:1}}*/}
                                    {/*data={this.XAxisData}*/}
                                    {/*formatLabel={(value, index) => index}*/}
                                    {/*contentInset={{ left: 10, right: 10 }}*/}
                                    {/*svg={{ fontSize: 10, fill: 'white' }}*/}
                                {/*/>*/}
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    }
};
