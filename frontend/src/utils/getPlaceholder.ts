export function getPlaceholder(lang: string): string {
    switch (lang) {
        case "cpp":
            return `#include<bits/stdc++.h>
using namespace std;

int main(){
    cout<<"Hello World!!"<<endl;
    return 0;
}`;

        case "c":
            return `#include <stdio.h>

int main() {
    printf("Hello World!!\\n");
    return 0;
}`;

        case "java":
            return `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World!!");
    }
}`;

        case "python":
            return `print("Hello World!!")`;

        default:
            return "";
    }
}
