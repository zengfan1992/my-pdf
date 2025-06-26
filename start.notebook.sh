input='/C/Users/gwx1330001/Downloads/Pandas数据分析实战 (帕斯哈弗) (Z-Library).pdf'
output='/C/Users/gwx1330001/Downloads/Pandas数据分析实战 (帕斯哈弗) (Z-Library)out.pdf'
java -jar pdftk-all.jar "$input" update_info bookmarks.txt output "$output"