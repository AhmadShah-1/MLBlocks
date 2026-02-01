# Category: Basic Python

# START
# Title: For Loop
# Output: None
for i in range(1):
    print("UNCONFIGURED")
# END

# START
# Title: Match Expression
# Output: None
day = 4
match day:
  case 1:
    print("Monday")
  case 2:
    print("Tuesday")
  case 3:
    print("Wednesday")
  case 4:
    print("Thursday")
  case 5:
    print("Friday")
  case 6:
    print("Saturday")
  case _:
    print("Sunday")
# END

# START
# Title: Iterators
# Output: None
mytuple = ("apple", "banana", "cherry")
myit = iter(mytuple)

print(next(myit))
print(next(myit))
print(next(myit))
# END

# START
# Title: Min/Max
# Output: None
x = min(5, 10, 25)
y = max(5, 10, 25)

print(x)
print(y)
# END