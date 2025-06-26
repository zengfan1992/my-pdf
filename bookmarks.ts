var marks = `第Ⅰ部分 Pandas核心基础 1
第1章 Pandas概述 2
1.1 21世纪的数据 2
1.2 Pandas介绍 3
1.3 Pandas之旅 6
1.4 本章小结 17
第2章 Series对象 18
2.1 Series概述 18
2.2 基于其他Python对象创建Series 24
2.3 Series属性 26
2.4 检索第一行和最后一行 28
2.5 数学运算 30
2.6 将Series传递给Python的内置函数 40
2.7 代码挑战 42
2.8 本章小结 44
第3章 Series方法 46
3.1 使用read_csv函数导入数据集 46
3.2 对Series进行排序 51
3.3 使用inplace参数替换原有Series 56
3.4 使用value_counts方法计算值的个数 57
3.5 使用apply方法对每个Series值调用一个函数 62
3.6 代码挑战 65
3.7 本章小结 67
第4章 DataFrame对象 68
4.1 DataFrame概述 69
4.2 Series和DataFrame的相似之处 72
4.3 对DataFrame进行排序 78
4.4 按照索引进行排序 81
4.5 设置新的索引 83
4.6 从DataFrame中选择列 84
4.7 从DataFrame中选择行 86
4.8 从Series中提取值 93
4.9 对行或列进行重命名 93
4.10 重置索引 94
4.11 代码挑战 96
4.12 本章小结 99
第5章 对DataFrame进行过滤 100
5.1 优化数据集以提高内存使用效率 100
5.2 按单个条件过滤 106
5.3 按多个条件过滤 109
5.4 按条件过滤 112
5.5 处理重复值 119
5.6 代码挑战 123
5.7 本章小结 127
第Ⅱ部分 应用Pandas 129
第6章 处理文本数据 130
6.1 字母的大小写和空格 130
6.2 字符串切片 134
6.3 字符串切片和字符替换 135
6.4 布尔型方法 137
6.5 拆分字符串 139
6.6 代码挑战 143
6.7 关于正则表达式的说明 145
6.8 本章小结 146
第7章 多级索引DataFrame 147
7.1 MultiIndex对象 148
7.2 MultiIndex DataFrame 151
7.3 对MultiIndex进行排序 156
7.4 通过MultiIndex提取列或行 159
7.5 交叉选择 168
7.6 索引操作 169
7.7 代码挑战 174
7.8 本章小结 177
第8章 数据集的重塑和透视 178
8.1 宽数据和窄数据 178
8.2 由DataFrame创建数据透视表 180
8.3 对索引级别进行堆叠和取消堆叠 186
8.4 融合数据集 188
8.5 展开值列表 191
8.6 代码挑战 193
8.7 本章小结 197
第9章 GroupBy对象 198
9.1 从头开始创建GroupBy对象 198
9.2 从数据集中创建GroupBy对象 200
9.3 GroupBy对象的属性和方法 202
9.4 聚合操作 206
9.5 将自定义操作应用于所有组 209
9.6 按多列分组 210
9.7 代码挑战 211
9.8 本章小结 214
第10章 合并与连接 215
10.1 本章使用的数据集 216
10.2 连接数据集 218
10.3 连接后的DataFrame中的
缺失值 220
10.4 左连接 222
10.5 内连接 223
10.6 外连接 225
10.7 合并索引标签 228
10.8 代码挑战 229
10.9 本章小结 233
第11章 处理日期和时间 235
11.1 引入Timestamp对象 235
11.2 在DatetimeIndex中存储多个时间戳 240
11.3 将列或索引值转换为日期时间类型数据 242
11.4 使用DatetimeProperties对象 243
11.5 使用持续时间进行加减 247
11.6 日期偏移 249
11.7 Timedelta对象 251
11.8 代码挑战 255
11.9 本章小结 260
第12章 导入和导出 261
12.1 读取和写入JSON文件 262
12.2 读取和写入CSV文件 270
12.3 读取和写入Excel工作簿 272
12.4 代码挑战 277
12.5 本章小结 279
第13章 配置Pandas 280
13.1 获取和设置Pandas选项 280
13.2 精度 284
13.3 列的最大宽度 285
13.4 截断阈值 286
13.5 上下文选项 286
13.6 本章小结 287
第14章 可视化 289
14.1 安装Matplotlib 289
14.2 折线图 290
14.3 条形图 294
14.4 饼图 296
14.5 本章小结 297
附录A 安装及配置 298
附录B Python速成课程 314
附录C NumPy速成教程 346
附录D 用Faker生成模拟数据 353
附录E 正则表达式 359`
var reg = /^(.*?)(\d+$)/g
var level3 = /^\d+\.\d+\.\d+/
var level2 = /^\d+\.\d+/
var outputContent = marks.split('\n').map(text => {
    reg.lastIndex = 0
    var [_, title, num] = reg.exec(text) || []
    let level = 1
    if (level2.test(title)) {
        level = 2
        if (level3.test(title)) {
            level = 3
        }
    }
    return `BookmarkBegin
BookmarkTitle: ${title}
BookmarkLevel: ${level}
BookmarkPageNumber: ${parseInt(num) + 16}`
}).join('\n\n')
console.log(outputContent)