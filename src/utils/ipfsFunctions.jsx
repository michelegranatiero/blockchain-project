import { Buffer } from 'buffer';
import { Web3 } from 'web3';

// Upload file to IPFS as JSON
export const sendToIPFS = async (fileObj, name) => {
  try {
    // Prepare json object (only pinataContent will be retrived from IPFS, the rest is metadata)
    const dataObj = { pinataContent: JSON.stringify(fileObj), pinataMetadata: { name: name }, pinataOptions: { cidVersion: 0 } };
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
    alert("Error uploading file to ipfs");
  }
}


// Download JSON file from IPFS
export const fetchFromIPFS = async (cid) => {
  try {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch data from IPFS');
    }

    const jsonFile = await response.json();
    const obj = JSON.parse(jsonFile);
    
    return obj;
  } catch (error) {
    console.error('Error fetching data from IPFS:', error);
  }
};


export const downloadFile = async (obj) => {
  try {

    const file =  await fetch(obj.content).then(response => response.blob()).then(blob => {
      return new File([blob], obj.name, {type: obj.type});
    });
  
    const url = window.URL.createObjectURL(
      file
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
  } catch (error) {
    console.error('Error fetching data from IPFS:', error);
  }
}

export const encodeCIDto2Bytes32 = (ipfsCID) => {
  //encode to ascii
  const ascii = []
  for (let i = 0; i < ipfsCID.length; i++) {
    ascii.push(ipfsCID.charCodeAt(i));
  }
  //console.log("ascii encode" ,[...ascii]); //ascii

  //from ascii to base64
  const base64str = Buffer.from(ascii).toString('base64');
  //console.log("base64 string", base64str.length, base64str);

  // split in 2 parts and convert to hex
  const part1 = Web3.utils.asciiToHex(base64str.slice(0, 32));
  const part2 = Web3.utils.asciiToHex(base64str.slice(32, 64));
  //console.log(part1, part2);
  return [part1, part2];
}

export const decode2Bytes32toCID = (part1, part2) => {
  //convert to base64
  const base64str = Web3.utils.hexToAscii(part1) + Web3.utils.hexToAscii(part2);
  //convert to ascii (CID)
  const ipfsCID = Buffer.from(base64str, 'base64').toString('ascii');
  return ipfsCID;
}

// Convert file to base64 string
export const fileToBase64 = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file); // convert file to base64 string (with prefix "data: MIME type") 
    
    // When the file is loaded, resolve the promise
    /* reader.onload is an event handler triggered when the reading operation
      initiated by reader.readAsDataURL() is complete */
    reader.onload = function() {
      resolve(reader.result);
    };

    reader.onerror = function(error) {
      reject(error);
    };
  });
};

