
type params = {
  lang: string
}
// Placeholders for every lang 
// NOTE: currently only cpp have to use array or map 
const cppPlaceholder = `#include<bits/stdc++.h>
using namespace std;

int main(){
    cout<<"Hello World!!"<<endl;
    return 0;
}`

export function Placeholder({ lang }: params) {
  if (lang === 'cpp') {
    return cppPlaceholder;
  }
}
