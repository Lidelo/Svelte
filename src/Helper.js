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
export function getValueFromIndex (index) {
    switch (index) {
        case 0: return "Producent"
        case 1: return "wielkość matrycy"
        case 2: return "rozdzielczość"
        case 3: return "typ matrycy"
        case 4: return "czy dotykowy ekran"
        case 5: return "procesor"
        case 6: return "liczba fizycznych rdzeni"
        case 7: return "taktowanie"
        case 8: return "RAM"
        case 9: return "pojemność dysku"
        case 10: return "typ dysku"
        case 11: return "karta graficzna"
        case 12: return "pamięć karty graficznej"
        case 13: return "system operacyjny"
        case 14: return "napęd optyczny"
    }
}
export function getExampleXmlData () {
    return "<laptops>\n" +
        "    <laptop>\n" +
        "        <manufacturer>Asus</manufacturer>\n" +
        "        <screen>\n" +
        "            <size>12\"</size>\n" +
        "            <type>matte</type>\n" +
        "            <touchscreen>nie</touchscreen>\n" +
        "        </screen>\n" +
        "        <processor>\n" +
        "            <name>i7</name>\n" +
        "            <physical_cores>8</physical_cores>\n" +
        "            <clock_speed>3200</clock_speed>\n" +
        "        </processor>\n" +
        "        <ram>8GB</ram>\n" +
        "        <disc>\n" +
        "            <storage>240GB</storage>\n" +
        "            <type>SSD</type>\n" +
        "        </disc>\n" +
        "        <graphic_card>\n" +
        "            <name>intel HD Graphics 4000</name>\n" +
        "            <memory>1GB</memory>\n" +
        "        </graphic_card>\n" +
        "        <os>Windows 7 Home</os>\n" +
        "        <disc_reader>Blu-Ray</disc_reader>\n" +
        "    </laptop>\n" +
        "    <laptop>\n" +
        "        <manufacturer>Dell</manufacturer>\n" +
        "        <screen>\n" +
        "            <size>16\"</size>\n" +
        "            <type/>\n" +
        "            <touchscreen>tak</touchscreen>\n" +
        "        </screen>\n" +
        "        <processor>\n" +
        "            <name>i5</name>\n" +
        "            <physical_cores>4</physical_cores>\n" +
        "            <clock_speed/>\n" +
        "        </processor>\n" +
        "        <ram>16GB</ram>\n" +
        "        <disc>\n" +
        "            <storage>120GB</storage>\n" +
        "            <type/>\n" +
        "        </disc>\n" +
        "        <graphic_card>\n" +
        "            <name>intel HD Graphics 5000</name>\n" +
        "            <memory>2GB</memory>\n" +
        "        </graphic_card>\n" +
        "        <os>Windows Vista</os>\n" +
        "        <disc_reader>brak</disc_reader>\n" +
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
