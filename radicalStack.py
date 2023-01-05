import pandas as pd

data = pd.read_csv("./datas.csv")
provinceSet = set()
yearSet = set()
provinceSet.update(data["province"].values)
yearSet.update(data["year"].values)
elementList = ["PM2.5(微克每立方米)", "PM10(微克每立方米)", "SO2(微克每立方米)", "NO2(微克每立方米)", "CO(毫克每立方米)"]

#数据删除
for i in data.columns:
    if i not in elementList and i != "province" and i != "year" and i != "month":
        data.drop(i,axis=1, inplace=True)

tmp0 = pd.DataFrame()
for province in provinceSet:
    for year in yearSet:
        tmp = data[(data["province"]==province) & (data["year"] == year)]
        maxValue = 0
        for element in elementList:
            m = tmp[element].sum()
            tmp["ori" + element] = tmp[element]
            tmp[element]/=m
            maxValue+=tmp[element].max()
        a = tmp.iloc[:,1:6]
        tmp["max"] = tmp.apply(lambda x: x.iloc[0:5].sum(), axis=1)
        tmp["max"] = tmp["max"].max()
        tmp0 = pd.concat([tmp0,tmp])
        aa = 1
tmp0["maximum"] = tmp0["max"].max()
tmp0.to_csv("radicalStack.csv")
a =1

