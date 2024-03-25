// Upload file to IPFS
export const sendToIPFS = async (file) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // convert file to base64 string (with prefix "data: MIME type") 
      
      // When the file is loaded, resolve the promise
      /* reader.onload is an event handler triggered when the reading operation
        initiated by reader.readAsDataURL() is complete */
      reader.onload = function() {
        const myJson = JSON.stringify({ name: file.name, content: reader.result, type: file.type });
        resolve(myJson);
      };

      reader.onerror = function(error) {
        reject(error);
      };
    });

    // Prepare json object (only pinataContent will be retrived from IPFS, the rest is metadata)
    const dataObj = { pinataContent: result, pinataMetadata: { name: file.name }, pinataOptions: { cidVersion: 1 } };
    const dataJson = JSON.stringify(dataObj);

    const options = {
      method: "POST",
      headers: { Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`, "Content-Type": "application/json" },
      body: dataJson,
    };

    console.log(import.meta.env);
    
    // Send file to IPFS
    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", options);
    const resData = await res.json();
    console.log("File loaded to IPFS, hash:", resData.IpfsHash);

    //Return IPFS hash
    return resData.IpfsHash;
         
  } catch (error) {
    console.log(error.message);
    alert("Trouble uploading file");
  }
}

export const fetchFromIPFS = async (cid) => {
  await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`, {
    method: 'GET',
  })
  .then((response) => response.json())
  .then(async (jsonFile) => {

    const obj = JSON.parse(jsonFile); // name, content, type
    
    const file =  await fetch(obj.content).then(response => response.blob()).then(blob => {
      return new File([blob], obj.name, {type: obj.type});
    });

    
    const url = window.URL.createObjectURL(
      file,
    );
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      file.name,
    );

    // Append to html link element page
    document.body.appendChild(link);

    // Start download
    link.click();

    // Clean up and remove the link
    link.parentNode.removeChild(link);
  });
}