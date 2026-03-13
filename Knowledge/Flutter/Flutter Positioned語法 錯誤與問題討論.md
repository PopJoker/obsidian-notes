- # 起因
	- ## APP自己測試完，到AJ手機Samsung A55上，出現異常
		- ### 異常解析
			- Positioned語法
				Bottom當初設置30，希望底部在+30不碰底做顯示，但因為沒有Sizebox或其他Wight限制，導致Positioned一直在找畫面底部，找就會一直創造底部，導致如下圖所示之狀況。
```dart
const Positioned({
	super.key,
	this.left,
	this.top,
	this.right,
	this.bottom,//這次錯誤的主因
	this.width,
	this.height,
	required super.child,
}) : assert(left == null || right == null || width == null),
assert(top == null || bottom == null || height == null);
```

> [!異常展示：下方空白區域應為到期日]
> ![[Pasted image 20260313170201.png|126]]

