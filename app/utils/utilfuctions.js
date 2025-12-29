const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
};

const formatDatetime = ()=>{
    var d = new Date(); 
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
    var datetime =  year+ "-"
                    + month + "-" 
                    + day + " "  
                    + d.getHours() + ":"  
                    + d.getMinutes() + ":" 
                    + d.getSeconds();
    return datetime;
}

const healthCheck = (req, res) =>{
    res.status(200).json({
        status: "Success",
        message: "App Running!",
    });
    return
}

const CurrentDate = () =>{
    const currentDateTime = new Date();
    currentDateTime.setHours(currentDateTime.getHours() + 5);
    currentDateTime.setMinutes(currentDateTime.getMinutes() + 30);
    return currentDateTime;
}

module.exports = {
    validateEmail,
    formatDatetime,
    healthCheck,
    CurrentDate
}