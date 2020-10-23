import convert from 'xml-js'

export function downloadBlobAsFile (blob, fileName) {
    const a = document.createElement("a")
    document.body.appendChild(a)
    a.style = "display: none"

    const url = window.URL.createObjectURL(blob)
    a.href = url
    a.download = fileName
    a.click()
    window.URL.revokeObjectURL(url)
}
export function downloadExampleData (mode) {
    const blob = new Blob([mode === 'txt' ? getExampleTxtData() : getExampleXmlData()],
        { type: `text/${mode};charset=utf-8` })
    downloadBlobAsFile(blob, `data.${mode}`)
}
export function convertComputersToTxt (computers) {
    if (computers.length === 0)  return ''
    let localData = ''
    computers.forEach((computer, computersIndex) => {
        Object.entries(computer.flat).forEach((entry, index) => {
            localData += `${entry[1]};`
            if (computersIndex !== computers.length - 1 && index === 14) {
                localData += `\n`
            }
        })
    })
    return localData
}
export function convertComputersToXml (computers) {
    const computersClone = JSON.parse(JSON.stringify(computers))
    let object = { laptops: { laptop: [] }}
    computersClone.forEach(computer => {
        delete computer.flat
        object.laptops.laptop.push(computer)
    })
    const options = {compact: true, ignoreComment: true, spaces: 4}
    return convert.json2xml(object, options)
}
export function getValueFromIndex (index) {
    switch (index) {
        case 0: return "manufacturer"
        case 1: return "size"
        case 2: return "resolution"
        case 3: return "screen_type"
        case 4: return "touchscreen"
        case 5: return "name"
        case 6: return "physical_cores"
        case 7: return "clock_speed"
        case 8: return "ram"
        case 9: return "storage"
        case 10: return "type"
        case 11: return "graphics_card_name"
        case 12: return "memory"
        case 13: return "os"
        case 14: return "disc_reader"
    }
}
export function mapObjectToComputer (laptop) {
    let mappedObject = getDefaultComputerObject()

    laptop.elements.forEach(props => {
        if (!props.elements) {
            mappedObject[props.name] = ''
            mappedObject.flat[props.elements] = ''
            return
        }
        console.log(props.elements)
        switch (props.name) {
            case "manufacturer":
                if (!props.elements) {
                    mappedObject.manufacturer = ''
                    mappedObject.flat.manufacturer = ''
                    break
                }
                props.elements.forEach(values => {
                    mappedObject.manufacturer = values.text
                    mappedObject.flat.manufacturer = values.text
                })
            break;
            case "screen":
                props.elements.forEach(nestedValues => {
                    const field = nestedValues.name === 'type' ? 'screen_type' : nestedValues.name
                    const value = nestedValues.elements ? nestedValues.elements[0].text : ''
                    mappedObject.screen[field] = value
                    mappedObject.flat[field] = value
                })
                break;
            case "processor":
                props.elements.forEach(nestedValues => {
                    const value = nestedValues.elements ? nestedValues.elements[0].text : ''
                    mappedObject.processor[nestedValues.name] = value
                    mappedObject.flat[nestedValues.name] = value
                })
                break;
            case "ram":
                props.elements.forEach(values => {
                    mappedObject.ram = values.text
                    mappedObject.flat.ram = values.text
                })
                break;
            case "disc":
                props.elements.forEach(nestedValues => {
                    const value = nestedValues.elements ? nestedValues.elements[0].text : ''
                    mappedObject.disc[nestedValues.name] = value
                    mappedObject.flat[nestedValues.name] = value
                })
                break;
            case "graphics_card":
                props.elements.forEach(nestedValues => {
                    const field = nestedValues.name === 'name' ? 'graphics_card_name' : nestedValues.name
                    const value = nestedValues.elements ? nestedValues.elements[0].text : ''
                    mappedObject.graphics_card[field] = value
                    mappedObject.flat[field] = value
                })
                break;
            case "os":
                props.elements.forEach(values => {
                    mappedObject.os = values.text
                    mappedObject.flat.os = values.text
                })
                break;
            case "disc_reader":
                props.elements.forEach(values => {
                    mappedObject.disc_reader = values.text
                    mappedObject.flat.disc_reader = values.text
                })
                break;
        }
    })
    mappedObject.flat = setObjectOrder(mappedObject.flat, getFlatKeysOrder())
    return mappedObject
}
export function setObjectOrder (obj, order) {
    var newObject = {};
    for(var i = 0; i < order.length; i++) {
        if(obj.hasOwnProperty(order[i])) {
            newObject[order[i]] = obj[order[i]];
        }
    }
    return newObject;
}
export function getFlatKeysOrder () {
    return ["manufacturer","size","resolution","screen_type","touchscreen","name", "physical_cores",
        "clock_speed","ram","storage","type","graphics_card_name","memory", "os", "disc_reader"]
}
export function getDefaultComputerObject () {
    return {
        disc: {
            storage: '',
            type: ''
        },
        disc_reader: '',
        flat: {
            clock_speed: '',
            disc_reader: '',
            graphics_card_name: '',
            manufacturer: '',
            memory: '',
            name: '',
            os: '',
            physical_cores: '',
            ram: '',
            resolution: '',
            screen_type: '',
            size: '',
            storage: '',
            touchscreen: '',
            type: ''
        },
        graphics_card: {
            graphics_card_name: '',
            memory: ''
        },
        manufacturer: '',
        os: '',
        processor: {
            name: '',
            physical_cores: '',
            clock_speed: ''
        },
        ram: '',
        screen: {
            size: '',
            resolution: '',
            screen_type: '',
            touchscreen: ''
        }
    }
}
export function getExampleXmlData () {
    return "<laptops>\n" +
      "    <laptop>\n" +
      "        <screen>\n" +
      "            <size>12\"</size>\n" +
      "            <resolution/>\n" +
      "            <screen_type>matowa</screen_type>\n" +
      "            <touchscreen>nie</touchscreen>\n" +
      "        </screen>\n" +
      "        <processor>\n" +
      "            <name>intel i7</name>\n" +
      "            <physical_cores>4</physical_cores>\n" +
      "            <clock_speed>2800</clock_speed>\n" +
      "        </processor>\n" +
      "        <disc>\n" +
      "            <storage>240GB</storage>\n" +
      "            <type>SSD</type>\n" +
      "        </disc>\n" +
      "        <graphics_card>\n" +
      "            <graphics_card_name>intel HD Graphics 4000</graphics_card_name>\n" +
      "            <memory>1GB</memory>\n" +
      "        </graphics_card>\n" +
      "        <manufacturer>Dell</manufacturer>\n" +
      "        <ram>8GB</ram>\n" +
      "        <os>Windows 7 Home</os>\n" +
      "        <disc_reader/>\n" +
      "    </laptop>\n" +
      "    <laptop>\n" +
      "        <screen>\n" +
      "            <size>14\"</size>\n" +
      "            <resolution>1600x900</resolution>\n" +
      "            <screen_type>matowa</screen_type>\n" +
      "            <touchscreen>nie</touchscreen>\n" +
      "        </screen>\n" +
      "        <processor>\n" +
      "            <name>intel i5</name>\n" +
      "            <physical_cores>4</physical_cores>\n" +
      "            <clock_speed/>\n" +
      "        </processor>\n" +
      "        <disc>\n" +
      "            <storage>120GB</storage>\n" +
      "            <type>SSD</type>\n" +
      "        </disc>\n" +
      "        <graphics_card>\n" +
      "            <graphics_card_name>intel HD Graphics 5000</graphics_card_name>\n" +
      "            <memory>1GB</memory>\n" +
      "        </graphics_card>\n" +
      "        <manufacturer>Asus</manufacturer>\n" +
      "        <ram>16GB</ram>\n" +
      "        <os/>\n" +
      "        <disc_reader>brak</disc_reader>\n" +
      "    </laptop>\n" +
      "    <laptop>\n" +
      "        <screen>\n" +
      "            <size>14\"</size>\n" +
      "            <resolution>1920x1080</resolution>\n" +
      "            <screen_type>blyszczaca</screen_type>\n" +
      "            <touchscreen>tak</touchscreen>\n" +
      "        </screen>\n" +
      "        <processor>\n" +
      "            <name>intel i7</name>\n" +
      "            <physical_cores>8</physical_cores>\n" +
      "            <clock_speed>1900</clock_speed>\n" +
      "        </processor>\n" +
      "        <disc>\n" +
      "            <storage>500GB</storage>\n" +
      "            <type>HDD</type>\n" +
      "        </disc>\n" +
      "        <graphics_card>\n" +
      "            <graphics_card_name>intel HD Graphics 520</graphics_card_name>\n" +
      "            <memory>1GB</memory>\n" +
      "        </graphics_card>\n" +
      "        <manufacturer>Fujitsu</manufacturer>\n" +
      "        <ram>24GB</ram>\n" +
      "        <os>brak systemu</os>\n" +
      "        <disc_reader>Blu-Ray</disc_reader>\n" +
      "    </laptop>\n" +
      "    <laptop>\n" +
      "        <screen>\n" +
      "            <size>13\"</size>\n" +
      "            <resolution/>\n" +
      "            <screen_type>matowa</screen_type>\n" +
      "            <touchscreen>nie</touchscreen>\n" +
      "        </screen>\n" +
      "        <processor>\n" +
      "            <name>intel i7</name>\n" +
      "            <physical_cores>4</physical_cores>\n" +
      "            <clock_speed>2400</clock_speed>\n" +
      "        </processor>\n" +
      "        <disc>\n" +
      "            <storage>24GB</storage>\n" +
      "            <type>HDD</type>\n" +
      "        </disc>\n" +
      "        <graphics_card>\n" +
      "            <graphics_card_name>NVIDIA GeForce GTX 1050</graphics_card_name>\n" +
      "            <memory/>\n" +
      "        </graphics_card>\n" +
      "        <manufacturer>Huawei</manufacturer>\n" +
      "        <ram>12GB</ram>\n" +
      "        <os/>\n" +
      "        <disc_reader>brak</disc_reader>\n" +
      "    </laptop>\n" +
      "    <laptop>\n" +
      "        <screen>\n" +
      "            <size>17\"</size>\n" +
      "            <resolution>1600x900</resolution>\n" +
      "            <screen_type>blyszczaca</screen_type>\n" +
      "            <touchscreen>tak</touchscreen>\n" +
      "        </screen>\n" +
      "        <processor>\n" +
      "            <name>intel i7</name>\n" +
      "            <physical_cores>4</physical_cores>\n" +
      "            <clock_speed>3300</clock_speed>\n" +
      "        </processor>\n" +
      "        <disc>\n" +
      "            <storage>60GB</storage>\n" +
      "            <type>SSD</type>\n" +
      "        </disc>\n" +
      "        <graphics_card>\n" +
      "            <graphics_card_name>AMD Radeon Pro 455</graphics_card_name>\n" +
      "            <memory>1GB</memory>\n" +
      "        </graphics_card>\n" +
      "        <manufacturer>MSI</manufacturer>\n" +
      "        <ram>8GB</ram>\n" +
      "        <os>Windows 7 Profesional</os>\n" +
      "        <disc_reader>DVD</disc_reader>\n" +
      "    </laptop>\n" +
      "    <laptop>\n" +
      "        <screen>\n" +
      "            <size/>\n" +
      "            <resolution>1280x800</resolution>\n" +
      "            <screen_type>matowa</screen_type>\n" +
      "            <touchscreen>nie</touchscreen>\n" +
      "        </screen>\n" +
      "        <processor>\n" +
      "            <name>intel i7</name>\n" +
      "            <physical_cores>4</physical_cores>\n" +
      "            <clock_speed>2800</clock_speed>\n" +
      "        </processor>\n" +
      "        <disc>\n" +
      "            <storage>240GB</storage>\n" +
      "            <type>SSD</type>\n" +
      "        </disc>\n" +
      "        <graphics_card>\n" +
      "            <graphics_card_name/>\n" +
      "            <memory/>\n" +
      "        </graphics_card>\n" +
      "        <manufacturer>Dell</manufacturer>\n" +
      "        <ram>8GB</ram>\n" +
      "        <os>Windows 7 Home</os>\n" +
      "        <disc_reader>brak</disc_reader>\n" +
      "    </laptop>\n" +
      "    <laptop>\n" +
      "        <screen>\n" +
      "            <size>14\"</size>\n" +
      "            <resolution>1600x900</resolution>\n" +
      "            <screen_type>matowa</screen_type>\n" +
      "            <touchscreen>nie</touchscreen>\n" +
      "        </screen>\n" +
      "        <processor>\n" +
      "            <name>intel i5</name>\n" +
      "            <physical_cores>4</physical_cores>\n" +
      "            <clock_speed>2800</clock_speed>\n" +
      "        </processor>\n" +
      "        <disc>\n" +
      "            <storage>120GB</storage>\n" +
      "            <type>SSD</type>\n" +
      "        </disc>\n" +
      "        <graphics_card>\n" +
      "            <graphics_card_name>intel HD Graphics 5000</graphics_card_name>\n" +
      "            <memory>1GB</memory>\n" +
      "        </graphics_card>\n" +
      "        <manufacturer>Asus</manufacturer>\n" +
      "        <ram/>\n" +
      "        <os>Windows 10 Home</os>\n" +
      "        <disc_reader/>\n" +
      "    </laptop>\n" +
      "    <laptop>\n" +
      "        <screen>\n" +
      "            <size>15\"</size>\n" +
      "            <resolution>1920x1080</resolution>\n" +
      "            <screen_type>blyszczaca</screen_type>\n" +
      "            <touchscreen>tak</touchscreen>\n" +
      "        </screen>\n" +
      "        <processor>\n" +
      "            <name>intel i7</name>\n" +
      "            <physical_cores>8</physical_cores>\n" +
      "            <clock_speed>2800</clock_speed>\n" +
      "        </processor>\n" +
      "        <disc>\n" +
      "            <storage>500GB</storage>\n" +
      "            <type>HDD</type>\n" +
      "        </disc>\n" +
      "        <graphics_card>\n" +
      "            <graphics_card_name>intel HD Graphics 520</graphics_card_name>\n" +
      "            <memory/>\n" +
      "        </graphics_card>\n" +
      "        <manufacturer>Fujitsu</manufacturer>\n" +
      "        <ram>24GB</ram>\n" +
      "        <os>brak systemu</os>\n" +
      "        <disc_reader>Blu-Ray</disc_reader>\n" +
      "    </laptop>\n" +
      "    <laptop>\n" +
      "        <screen>\n" +
      "            <size>13\"</size>\n" +
      "            <resolution>1366x768</resolution>\n" +
      "            <screen_type>matowa</screen_type>\n" +
      "            <touchscreen>nie</touchscreen>\n" +
      "        </screen>\n" +
      "        <processor>\n" +
      "            <name>intel i7</name>\n" +
      "            <physical_cores>4</physical_cores>\n" +
      "            <clock_speed>2800</clock_speed>\n" +
      "        </processor>\n" +
      "        <disc>\n" +
      "            <storage>24GB</storage>\n" +
      "            <type>HDD</type>\n" +
      "        </disc>\n" +
      "        <graphics_card>\n" +
      "            <graphics_card_name>NVIDIA GeForce GTX 1050</graphics_card_name>\n" +
      "            <memory>1GB</memory>\n" +
      "        </graphics_card>\n" +
      "        <manufacturer>Samsung</manufacturer>\n" +
      "        <ram>12GB</ram>\n" +
      "        <os>Windows 10 Home</os>\n" +
      "        <disc_reader>brak</disc_reader>\n" +
      "    </laptop>\n" +
      "    <laptop>\n" +
      "        <screen>\n" +
      "            <size>16\"</size>\n" +
      "            <resolution/>\n" +
      "            <screen_type>blyszczaca</screen_type>\n" +
      "            <touchscreen>tak</touchscreen>\n" +
      "        </screen>\n" +
      "        <processor>\n" +
      "            <name>intel i7</name>\n" +
      "            <physical_cores>4</physical_cores>\n" +
      "            <clock_speed>2800</clock_speed>\n" +
      "        </processor>\n" +
      "        <disc>\n" +
      "            <storage/>\n" +
      "            <type/>\n" +
      "        </disc>\n" +
      "        <graphics_card>\n" +
      "            <graphics_card_name>AMD Radeon Pro 455</graphics_card_name>\n" +
      "            <memory>1GB</memory>\n" +
      "        </graphics_card>\n" +
      "        <manufacturer>Sony</manufacturer>\n" +
      "        <ram>8GB</ram>\n" +
      "        <os>Windows 7 Profesional</os>\n" +
      "        <disc_reader>DVD</disc_reader>\n" +
      "    </laptop>\n" +
      "    <laptop>\n" +
      "        <screen>\n" +
      "            <size>12\"</size>\n" +
      "            <resolution>1280x800</resolution>\n" +
      "            <screen_type>matowa</screen_type>\n" +
      "            <touchscreen>nie</touchscreen>\n" +
      "        </screen>\n" +
      "        <processor>\n" +
      "            <name>intel i7</name>\n" +
      "            <physical_cores/>\n" +
      "            <clock_speed>2120</clock_speed>\n" +
      "        </processor>\n" +
      "        <disc>\n" +
      "            <storage/>\n" +
      "            <type/>\n" +
      "        </disc>\n" +
      "        <graphics_card>\n" +
      "            <graphics_card_name>intel HD Graphics 4000</graphics_card_name>\n" +
      "            <memory>1GB</memory>\n" +
      "        </graphics_card>\n" +
      "        <manufacturer>Samsung</manufacturer>\n" +
      "        <ram/>\n" +
      "        <os/>\n" +
      "        <disc_reader>brak</disc_reader>\n" +
      "    </laptop>\n" +
      "    <laptop>\n" +
      "        <screen>\n" +
      "            <size>14\"</size>\n" +
      "            <resolution>1600x900</resolution>\n" +
      "            <screen_type>matowa</screen_type>\n" +
      "            <touchscreen>nie</touchscreen>\n" +
      "        </screen>\n" +
      "        <processor>\n" +
      "            <name>intel i5</name>\n" +
      "            <physical_cores/>\n" +
      "            <clock_speed/>\n" +
      "        </processor>\n" +
      "        <disc>\n" +
      "            <storage/>\n" +
      "            <type>SSD</type>\n" +
      "        </disc>\n" +
      "        <graphics_card>\n" +
      "            <graphics_card_name>intel HD Graphics 5000</graphics_card_name>\n" +
      "            <memory>1GB</memory>\n" +
      "        </graphics_card>\n" +
      "        <manufacturer>Samsung</manufacturer>\n" +
      "        <ram/>\n" +
      "        <os>Windows 10 Home</os>\n" +
      "        <disc_reader>brak</disc_reader>\n" +
      "    </laptop>\n" +
      "    <laptop>\n" +
      "        <screen>\n" +
      "            <size>15\"</size>\n" +
      "            <resolution>1920x1080</resolution>\n" +
      "            <screen_type>blyszczaca</screen_type>\n" +
      "            <touchscreen>tak</touchscreen>\n" +
      "        </screen>\n" +
      "        <processor>\n" +
      "            <name>intel i7</name>\n" +
      "            <physical_cores>8</physical_cores>\n" +
      "            <clock_speed>2800</clock_speed>\n" +
      "        </processor>\n" +
      "        <disc>\n" +
      "            <storage>500GB</storage>\n" +
      "            <type>HDD</type>\n" +
      "        </disc>\n" +
      "        <graphics_card>\n" +
      "            <graphics_card_name>intel HD Graphics 520</graphics_card_name>\n" +
      "            <memory/>\n" +
      "        </graphics_card>\n" +
      "        <manufacturer>Fujitsu</manufacturer>\n" +
      "        <ram>24GB</ram>\n" +
      "        <os>brak systemu</os>\n" +
      "        <disc_reader>Blu-Ray</disc_reader>\n" +
      "    </laptop>\n" +
      "    <laptop>\n" +
      "        <screen>\n" +
      "            <size>13\"</size>\n" +
      "            <resolution>1366x768</resolution>\n" +
      "            <screen_type>matowa</screen_type>\n" +
      "            <touchscreen>nie</touchscreen>\n" +
      "        </screen>\n" +
      "        <processor>\n" +
      "            <name>intel i7</name>\n" +
      "            <physical_cores>4</physical_cores>\n" +
      "            <clock_speed>3000</clock_speed>\n" +
      "        </processor>\n" +
      "        <disc>\n" +
      "            <storage>24GB</storage>\n" +
      "            <type>HDD</type>\n" +
      "        </disc>\n" +
      "        <graphics_card>\n" +
      "            <graphics_card_name>NVIDIA GeForce GTX 1050</graphics_card_name>\n" +
      "            <memory/>\n" +
      "        </graphics_card>\n" +
      "        <manufacturer>Huawei</manufacturer>\n" +
      "        <ram/>\n" +
      "        <os>Windows 10 Home</os>\n" +
      "        <disc_reader>brak</disc_reader>\n" +
      "    </laptop>\n" +
      "    <laptop>\n" +
      "        <screen>\n" +
      "            <size>17\"</size>\n" +
      "            <resolution>1600x900</resolution>\n" +
      "            <screen_type>blyszczaca</screen_type>\n" +
      "            <touchscreen>tak</touchscreen>\n" +
      "        </screen>\n" +
      "        <processor>\n" +
      "            <name>intel i7</name>\n" +
      "            <physical_cores>4</physical_cores>\n" +
      "            <clock_speed>9999</clock_speed>\n" +
      "        </processor>\n" +
      "        <disc>\n" +
      "            <storage>60GB</storage>\n" +
      "            <type>SSD</type>\n" +
      "        </disc>\n" +
      "        <graphics_card>\n" +
      "            <graphics_card_name>AMD Radeon Pro 455</graphics_card_name>\n" +
      "            <memory>1GB</memory>\n" +
      "        </graphics_card>\n" +
      "        <manufacturer>MSI</manufacturer>\n" +
      "        <ram>8GB</ram>\n" +
      "        <os>Windows 7 Profesional</os>\n" +
      "        <disc_reader/>\n" +
      "    </laptop>\n" +
      "</laptops>"
}
export function getExampleTxtData () {
    return "Dell;12\";;matowa;nie;intel i7;4;2800;8GB;240GB;SSD;intel HD Graphics 4000;1GB;Windows 7 Home;;\n" +
      "Asus;14\";1600x900;matowa;nie;intel i5;4;;16GB;120GB;SSD;intel HD Graphics 5000;1GB;;brak;\n" +
      "Fujitsu;14\";1920x1080;blyszczaca;tak;intel i7;8;1900;24GB;500GB;HDD;intel HD Graphics 520;1GB;brak systemu;Blu-Ray;\n" +
      "Huawei;13\";;matowa;nie;intel i7;4;2400;12GB;24GB;HDD;NVIDIA GeForce GTX 1050;;;brak;\n" +
      "MSI;17\";1600x900;blyszczaca;tak;intel i7;4;3300;8GB;60GB;SSD;AMD Radeon Pro 455;1GB;Windows 7 Profesional;DVD;\n" +
      "Dell;;1280x800;matowa;nie;intel i7;4;2800;8GB;240GB;SSD;;;Windows 7 Home;brak;\n" +
      "Asus;14\";1600x900;matowa;nie;intel i5;4;2800;;120GB;SSD;intel HD Graphics 5000;1GB;Windows 10 Home;;\n" +
      "Fujitsu;15\";1920x1080;blyszczaca;tak;intel i7;8;2800;24GB;500GB;HDD;intel HD Graphics 520;;brak systemu;Blu-Ray;\n" +
      "Samsung;13\";1366x768;matowa;nie;intel i7;4;2800;12GB;24GB;HDD;NVIDIA GeForce GTX 1050;1GB;Windows 10 Home;brak;\n" +
      "Sony;16\";;blyszczaca;tak;intel i7;4;2800;8GB;;;AMD Radeon Pro 455;1GB;Windows 7 Profesional;DVD;\n" +
      "Samsung;12\";1280x800;matowa;nie;intel i7;;2120;;;;intel HD Graphics 4000;1GB;;brak;\n" +
      "Samsung;14\";1600x900;matowa;nie;intel i5;;;;;SSD;intel HD Graphics 5000;1GB;Windows 10 Home;brak;\n" +
      "Fujitsu;15\";1920x1080;blyszczaca;tak;intel i7;8;2800;24GB;500GB;HDD;intel HD Graphics 520;;brak systemu;Blu-Ray;\n" +
      "Huawei;13\";1366x768;matowa;nie;intel i7;4;3000;;24GB;HDD;NVIDIA GeForce GTX 1050;;Windows 10 Home;brak;\n" +
      "MSI;17\";1600x900;blyszczaca;tak;intel i7;4;9999;8GB;60GB;SSD;AMD Radeon Pro 455;1GB;Windows 7 Profesional;;"
}
